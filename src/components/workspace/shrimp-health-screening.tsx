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

async function classifyImage(file: File): Promise<Prediction[]> {
  const bitmap = await createImageBitmap(file)
  try {
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

    return toProbabilities(output.data as ArrayLike<number>)
      .map((confidence, index) => ({ label: CLASS_NAMES[index], confidence }))
      .sort((left, right) => right.confidence - left.confidence)
  } finally {
    bitmap.close()
  }
}

export function ShrimpHealthScreening() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [predictions, setPredictions] = useState<Prediction[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modelReady, setModelReady] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

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
      <Button
        type="button"
        className="button-primary"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? 'Checking image on this device…' : previewUrl ? 'Choose another photo' : 'Choose a shrimp photo'}
        <span aria-hidden="true">↑</span>
      </Button>
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
