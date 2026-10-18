'use client'

import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.2,
      lerp: 0.1,
      smoothWheel: true,
    })

    let frameId = 0
    const animate = (time: number) => {
      lenis.raf(time)
      frameId = window.requestAnimationFrame(animate)
    }

    frameId = window.requestAnimationFrame(animate)
    return () => {
      window.cancelAnimationFrame(frameId)
      lenis.destroy()
    }
  }, [])

  return children
}
