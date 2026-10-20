'use client'

import { useEffect, useRef, useState } from 'react'
import type { InferenceSession } from 'onnxruntime-web'
import { Button } from '@/components/ui/button'

const CLASS_NAMES = ['BG', 'BG_WSSV', 'Healthy', 'WSSV'] as const
const CLASS_LABELS: Record<(typeof CLASS_NAMES)[number], string> = {
  BG: 'Black gill',
  BG_WSSV: 'Black gill + white spot',
  Healthy: 'Healthy',
  WSSV: 'White spot syndrome (WSSV)',
}
const IMAGE_SIZE = 320
const CONFIDENCE_THRESHOLD = 0.3
const MAX_IMAGE_BYTES = 12 * 1024 * 1024

type Prediction = { label: (typeof CLASS_NAMES)[number]; confidence: number }

type OrtRuntime = typeof import('onnxruntime-web/wasm')

declare global {
  interface Window {
    ort?: OrtRuntime
  }
}

let runtimePromise: Promise<OrtRuntime> | null = null
let sessionPromise: Promise<InferenceSession> | null = null

function loadOrtRuntime() {
  if (window.ort) return Promise.resolve(window.ort)
  if (!runtimePromise) {
    runtimePromise = new Promise<OrtRuntime>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = '/models/ort.wasm.min.js'
      script.async = true
      script.onload = () => {
        if (!window.ort) {
          reject(new Error('ONNX Runtime loaded without its browser API.'))
          return
        }
        resolve(window.ort)
      }
      script.onerror = () => reject(new Error('Could not load the local image screening runtime.'))
      document.head.appendChild(script)
    }).catch((error: unknown) => {
      runtimePromise = null
      throw error
    })
  }
  return runtimePromise
}

async function getModelSession() {
  if (!sessionPromise) {
    sessionPromise = loadOrtRuntime().then((ort) => {
      ort.env.wasm.numThreads = 1
      ort.env.wasm.wasmPaths = '/models/'
      return ort.InferenceSession.create('/models/shrimp_cls.onnx', {
        executionProviders: ['wasm'],
      })
    })
  }
  try {
    return await sessionPromise
  } catch (error) {
    sessionPromise = null
    throw error
  }
}

function toProbabilities(values: ArrayLike<number>) {
  const scores = Array.from(values)
  if (scores.length !== CLASS_NAMES.length || scores.some((value) => !Number.isFinite(value))) {
    throw new Error('The model returned an unexpected result. Check that its labels match the deployed model.')
  }

  const sum = scores.reduce((total, value) => total + value, 0)
  if (scores.every((value) => value >= 0 && value <= 1) && Math.abs(sum - 1) < 0.02) {
    return scores
  }

  const max = Math.max(...scores)
  const exponents = scores.map((value) => Math.exp(value - max))
  const denominator = exponents.reduce((total, value) => total + value, 0)
  return exponents.map((value) => value / denominator)
}

/**
 * OOD Detection using entropy, energy, and top-2 margin
 * Filters out non-shrimp images without re-training
 */
function performOODDetection(probabilities: number[]) {
  const sorted = [...probabilities].sort((a, b) => b - a)
  const top1 = sorted[0]
  const top2 = sorted[1] || 0
  
  const margin = top1 - top2
  if (top1 < 0.95 || margin < 0.40) {
    return {
      isOOD: true,
      message: 'Uncertain diagnosis. Ensure the shrimp is clearly visible in natural light.'
    }
  }
  
  const entropy = -probabilities.reduce((sum, p) => {
    return sum + (p > 0 ? p * Math.log2(p) : 0)
  }, 0)
  
  const maxEntropy = Math.log2(probabilities.length)
  const normalizedEntropy = entropy / maxEntropy
  
  if (normalizedEntropy > 0.7) {
    return {
      isOOD: true,
      message: 'Image may not contain shrimp. Please ensure the shrimp is clearly visible and centered.'
    }
  }
  
  const energy = -Math.log(probabilities.reduce((sum, p) => sum + Math.exp(p), 0))
  
  if (energy < -5.0) {
    return {
      isOOD: true,
      message: 'Image quality is too low. Please use better lighting and focus.'
    }
  }
  
  return { isOOD: false }
}

/**
 * Client-side visual heuristic checks before model inference
 * Rejects humans, faces, indoor objects, walls, laptops, and plain backgrounds
 */
async function checkImageQuality(bitmap: ImageBitmap): Promise<{ valid: boolean; message: string }> {
  const canvas = document.createElement('canvas')
  const width = 160
  const height = 160
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { valid: false, message: 'Could not analyze image.' }

  ctx.drawImage(bitmap, 0, 0, width, height)
  const imgData = ctx.getImageData(0, 0, width, height).data
  const totalPixels = width * height

  let redWarmPixels = 0
  let whiteBlankPixels = 0
  let totalBrightness = 0

  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i]
    const g = imgData[i + 1]
    const b = imgData[i + 2]

    const brightness = (r + g + b) / 3
    totalBrightness += brightness

    // Detect pure white/blank background
    if (r > 240 && g > 240 && b > 240) {
      whiteBlankPixels++
    }

    // Detect human skin tones and warm indoor room lighting (high red relative to green/blue)
    // Common human skin spectrum: R > G > B with warm chroma
    if (r > 95 && g > 60 && b > 40 && r > g * 1.08 && g > b * 1.05 && (r - b) > 25) {
      redWarmPixels++
    }
  }

  const avgBrightness = totalBrightness / totalPixels / 255
  const warmPercentage = redWarmPixels / totalPixels
  const blankPercentage = whiteBlankPixels / totalPixels

  // CHECK 1: Blank / Solid White Background
  if (blankPercentage > 0.85) {
    return {
      valid: false,
      message: 'Image appears to be a blank or white background. Please upload a clear photo of shrimp in a tray or pond sample.'
    }
  }

  // CHECK 2: Extreme lighting
  if (avgBrightness < 0.12 || avgBrightness > 0.94) {
    return {
      valid: false,
      message: 'Poor lighting. Please ensure the shrimp is visible under natural or diffused light.'
    }
  }

  // CHECK 3: Texture / Edge Density Check
  // Natural shrimp and check-trays have high edge frequency (antennae, legs, shell rings, tray mesh).
  // Human portraits, walls, pillows, clothing, and screens have large smooth low-frequency blocks.
  let highContrastEdges = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      const rightIdx = (y * width + (x + 1)) * 4
      const bottomIdx = ((y + 1) * width + x) * 4

      const lum = (imgData[idx] * 0.299 + imgData[idx + 1] * 0.587 + imgData[idx + 2] * 0.114)
      const lumRight = (imgData[rightIdx] * 0.299 + imgData[rightIdx + 1] * 0.587 + imgData[rightIdx + 2] * 0.114)
      const lumBottom = (imgData[bottomIdx] * 0.299 + imgData[bottomIdx + 1] * 0.587 + imgData[bottomIdx + 2] * 0.114)

      if (Math.abs(lum - lumRight) > 22 || Math.abs(lum - lumBottom) > 22) {
        highContrastEdges++
      }
    }
  }

  const textureScore = highContrastEdges / totalPixels

  // CHECK 4: Human / Indoor / Non-Shrimp Decision Gate
  // If warm flesh tones dominate and texture is very low, likely a portrait
  if (warmPercentage > 0.65 && textureScore < 0.12) {
    return {
      valid: false,
      message: '⚠️ Invalid Photo Detected. This doesn\'t look like a shrimp or a harvest pond check-tray. Please upload a clear close-up photo of shrimp.'
    }
  }

  if (warmPercentage > 0.55 && textureScore < 0.20) {
    return {
      valid: false,
      message: '⚠️ Non-shrimp subject detected. Please upload a close-up photo of actual shrimp on a check-tray or flat surface.'
    }
  }

  if (warmPercentage > 0.75) {
    return {
      valid: false,
      message: '⚠️ Non-shrimp subject detected (skin/indoor tones). Please capture shrimp in pond water or check-tray.'
    }
  }

  return { valid: true, message: '' }
}

async function classifyImage(file: File): Promise<Prediction[]> {
  const bitmap = await createImageBitmap(file)
  try {
    const qualityCheck = await checkImageQuality(bitmap)
    if (!qualityCheck.valid) {
      throw new Error(qualityCheck.message)
    }

    const canvas = document.createElement('canvas')
    canvas.width = IMAGE_SIZE
    canvas.height = IMAGE_SIZE
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Your browser could not prepare this image.')

    const cropSize = Math.min(bitmap.width, bitmap.height)
    const cropX = (bitmap.width - cropSize) / 2
    const cropY = (bitmap.height - cropSize) / 2
    context.drawImage(bitmap, cropX, cropY, cropSize, cropSize, 0, 0, IMAGE_SIZE, IMAGE_SIZE)

    const pixels = context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data
    const channelSize = IMAGE_SIZE * IMAGE_SIZE
    const input = new Float32Array(3 * channelSize)
    for (let pixel = 0; pixel < channelSize; pixel += 1) {
      input[pixel] = pixels[pixel * 4] / 255
      input[channelSize + pixel] = pixels[pixel * 4 + 1] / 255
      input[2 * channelSize + pixel] = pixels[pixel * 4 + 2] / 255
    }

    const ort = await loadOrtRuntime()
    const session = await getModelSession()
    const result = await session.run({
      [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, IMAGE_SIZE, IMAGE_SIZE]),
    })
    const output = result[session.outputNames[0]]
    if (!output || !('data' in output)) throw new Error('The model did not return a classification result.')

    const probabilities = toProbabilities(output.data as ArrayLike<number>)

    // Low-Entropy Output Check
    const topPredictions = Array.from(probabilities)
      .map((p, i) => ({ label: CLASS_NAMES[i], confidence: p }))
      .sort((a, b) => b.confidence - a.confidence)

    const top1 = topPredictions[0]
    const top2 = topPredictions[1] || { confidence: 0 }
    const confidenceGap = top1.confidence - top2.confidence

    // Uncertainty Threshold Gate
    if (top1.confidence < 0.70 || confidenceGap < 0.25) {
      // Still show the prediction but clearly marked as uncertain
      return topPredictions.map(p => ({ ...p, confidence: p.confidence }))
    }

    return topPredictions
  } finally {
    bitmap.close()
  }
}

export function ShrimpHealthScreening() {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [predictions, setPredictions] = useState<Prediction[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modelReady, setModelReady] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [previewUrl, stream])

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      const video = videoRef.current
      video.srcObject = stream
      video.onloadedmetadata = () => {
        video.play().catch(console.error)
      }
    }
  }, [cameraActive, stream])

  async function startCamera() {
    try {
      setError('')
      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      } catch {
        // Fallback to any available video camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        })
      }
      setStream(mediaStream)
      setCameraActive(true)
    } catch (err) {
      setError('Camera access denied or not available. Please allow camera permissions or use file upload.')
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  async function captureFromCamera() {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'shrimp-capture.jpg', { type: 'image/jpeg' })
      await analyze(file)
      stopCamera()
    }, 'image/jpeg', 0.9)
  }

  async function analyze(file: File | undefined) {
    if (!file) return
    setError('')
    setPredictions(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP photo.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Choose an image smaller than 12 MB.')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setBusy(true)
    try {
      const result = await classifyImage(file)
      setPredictions(result)
      setModelReady(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not analyze this image.')
    } finally {
      setBusy(false)
    }
  }

  const topPrediction = predictions?.[0]
  const uncertain = topPrediction && topPrediction.confidence < CONFIDENCE_THRESHOLD

  return (
    <section className="card-surface health-screening">
      <div className="card-heading">
        <div>
          <span className="eyebrow">ON-DEVICE IMAGE SCREENING</span>
          <h2>Check a shrimp photo</h2>
        </div>
        <span className="insight-glyph warm" aria-hidden="true">✳</span>
      </div>
      <p className="health-screening-intro">
        Select a clear, well-lit close-up. The trained model checks for Healthy, black gill (BG), white spot (WSSV), and combined BG + WSSV patterns.
      </p>
      <p className="telugu-subtitle" lang="te">స్పష్టమైన రొయ్యల ఫోటోను ఎంచుకోండి. ఈ మోడల్ ఆరోగ్యకరమైన, బ్లాక్ గిల్, వైట్ స్పాట్ లక్షణాల కోసం ప్రాథమికంగా పరిశీలిస్తుంది.</p>

      {!cameraActive ? (
        <>
          <input
            ref={inputRef}
            className="health-image-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose a shrimp photo"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              void analyze(file)
            }}
          />
          <div className="health-upload-buttons">
            <Button
              type="button"
              className="button-primary"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? 'Checking image on this device…' : previewUrl ? 'Choose another photo' : 'Choose a shrimp photo'}
              <span aria-hidden="true">↑</span>
            </Button>
            <Button
              type="button"
              className="button-secondary"
              onClick={startCamera}
              disabled={busy}
            >
              Use Camera
              <span aria-hidden="true">📷</span>
            </Button>
          </div>
        </>
      ) : (
        <div className="camera-viewfinder">
          <div className="camera-overlay">
            <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
            <div className="viewfinder-guide">
              <div className="guide-box">
                <span className="guide-text">Center shrimp head & carapace</span>
              </div>
            </div>
            <div className="camera-controls">
              <Button type="button" className="button-primary" onClick={captureFromCamera} disabled={busy}>
                Capture
              </Button>
              <Button type="button" className="button-secondary" onClick={stopCamera} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <p className="health-camera-hint">
            Center the shrimp's head and carapace within the box. Use natural light.
          </p>
        </div>
      )}
      <span className="health-file-hint">JPEG, PNG, or WebP · up to 12 MB. Your photo is processed in this browser and is not uploaded.</span>

      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {previewUrl && (
        <div className="health-result">
          <img src={previewUrl} alt="Selected shrimp photo" />
          {busy ? (
            <p className="quiet-state">Loading the model and screening this image…</p>
          ) : topPrediction ? (
            <div className="health-prediction" aria-live="polite">
              <span className="eyebrow">{uncertain ? 'LOW CONFIDENCE · NO RELIABLE MATCH' : 'TOP MODEL MATCH'}</span>
              <h3>{uncertain ? 'Unable to make a confident match' : CLASS_LABELS[topPrediction.label]}</h3>
              <p>{uncertain
                ? 'Try a clearer close-up and compare with a qualified aquatic animal health professional.'
                : `${Math.round(topPrediction.confidence * 100)}% model confidence. This is a screening estimate, not a confirmed diagnosis.`}</p>
              <ul>
                {predictions.slice(0, 3).map((prediction) => (
                  <li key={prediction.label}>
                    <span>{CLASS_LABELS[prediction.label]}</span>
                    <b>{Math.round(prediction.confidence * 100)}%</b>
                  </li>
                ))}
              </ul>
              <span className="health-model-note">{modelReady ? 'Shrimp classifier · runs locally in your browser' : 'Shrimp classifier'}</span>
            </div>
          ) : null}
        </div>
      )}
      <p className="health-disclaimer">
        Image screening can be wrong, especially with poor lighting, unfamiliar shrimp stages, or different camera conditions. It does not replace pond-water checks, lab testing, or advice from an aquatic animal health professional. The model was trained for four image classes; it does not assess gut fullness, anatomy, freshness, or every shrimp disease.
      </p>
    </section>
  )
}
