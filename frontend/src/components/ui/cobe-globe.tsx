"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react"
import createGlobe from "cobe"

export interface Marker {
  id: string
  location: [number, number]
  label: string
}

export interface Arc {
  id: string
  from: [number, number]
  to: [number, number]
  label?: string
}

interface GlobeProps {
  markers?: Marker[]
  arcs?: Arc[]
  className?: string
  markerColor?: [number, number, number]
  baseColor?: [number, number, number]
  arcColor?: [number, number, number]
  glowColor?: [number, number, number]
  dark?: number
  mapBrightness?: number
  markerSize?: number
  markerElevation?: number
  arcWidth?: number
  arcHeight?: number
  speed?: number
  theta?: number
  diffuse?: number
  mapSamples?: number
}

type GlobeConfig = {
  markers: Marker[]
  arcs: Arc[]
  markerColor: [number, number, number]
  baseColor: [number, number, number]
  arcColor: [number, number, number]
  glowColor: [number, number, number]
  dark: number
  mapBrightness: number
  markerSize: number
  markerElevation: number
  arcWidth: number
  arcHeight: number
  speed: number
  theta: number
  diffuse: number
  mapSamples: number
}

function buildConfig(p: GlobeProps): GlobeConfig {
  return {
    markers: p.markers ?? [],
    arcs: p.arcs ?? [],
    markerColor: p.markerColor ?? [0.3, 0.45, 0.85],
    baseColor: p.baseColor ?? [1, 1, 1],
    arcColor: p.arcColor ?? [0.3, 0.45, 0.85],
    glowColor: p.glowColor ?? [0.94, 0.93, 0.91],
    dark: p.dark ?? 0,
    mapBrightness: p.mapBrightness ?? 10,
    markerSize: p.markerSize ?? 0.025,
    markerElevation: p.markerElevation ?? 0.01,
    arcWidth: p.arcWidth ?? 0.5,
    arcHeight: p.arcHeight ?? 0.25,
    speed: p.speed ?? 0.003,
    theta: p.theta ?? 0.2,
    diffuse: p.diffuse ?? 1.5,
    mapSamples: p.mapSamples ?? 16000,
  }
}

export function Globe({
  markers = [],
  arcs = [],
  className = "",
  markerColor = [0.3, 0.45, 0.85],
  baseColor = [1, 1, 1],
  arcColor = [0.3, 0.45, 0.85],
  glowColor = [0.94, 0.93, 0.91],
  dark = 0,
  mapBrightness = 10,
  markerSize = 0.025,
  markerElevation = 0.01,
  arcWidth = 0.5,
  arcHeight = 0.25,
  speed = 0.003,
  theta = 0.2,
  diffuse = 1.5,
  mapSamples = 16000,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const velocity = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const configRef = useRef<GlobeConfig>(
    buildConfig({
      markers,
      arcs,
      markerColor,
      baseColor,
      arcColor,
      glowColor,
      dark,
      mapBrightness,
      markerSize,
      markerElevation,
      arcWidth,
      arcHeight,
      speed,
      theta,
      diffuse,
      mapSamples,
    })
  )

  useLayoutEffect(() => {
    configRef.current = buildConfig({
      markers,
      arcs,
      markerColor,
      baseColor,
      arcColor,
      glowColor,
      dark,
      mapBrightness,
      markerSize,
      markerElevation,
      arcWidth,
      arcHeight,
      speed,
      theta,
      diffuse,
      mapSamples,
    })
  }, [
    markers,
    arcs,
    markerColor,
    baseColor,
    arcColor,
    glowColor,
    dark,
    mapBrightness,
    markerSize,
    markerElevation,
    arcWidth,
    arcHeight,
    speed,
    theta,
    diffuse,
    mapSamples,
  ])

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      pointerInteracting.current = { x: e.clientX, y: e.clientY }
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
      isPausedRef.current = true
    },
    []
  )

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x
      const deltaY = e.clientY - pointerInteracting.current.y
      dragOffset.current = { phi: deltaX / 300, theta: deltaY / 1000 }
      const now = Date.now()
      if (lastPointer.current) {
        const dt = Math.max(now - lastPointer.current.t, 1)
        const maxVelocity = 0.15
        velocity.current = {
          phi: Math.max(-maxVelocity, Math.min(maxVelocity, ((e.clientX - lastPointer.current.x) / dt) * 0.3)),
          theta: Math.max(-maxVelocity, Math.min(maxVelocity, ((e.clientY - lastPointer.current.y) / dt) * 0.08)),
        }
      }
      lastPointer.current = { x: e.clientX, y: e.clientY, t: now }
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
      lastPointer.current = null
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId = 0
    let phi = 0
    let resizeObserver: ResizeObserver | null = null

    function initGlobe(el: HTMLCanvasElement) {
      const width = el.offsetWidth
      if (width === 0 || globe) return

      const cfg = configRef.current
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      globe = createGlobe(el, {
        devicePixelRatio: dpr,
        width,
        height: width,
        phi: 0,
        theta: cfg.theta,
        dark: cfg.dark,
        diffuse: cfg.diffuse,
        mapSamples: cfg.mapSamples,
        mapBrightness: cfg.mapBrightness,
        baseColor: cfg.baseColor,
        markerColor: cfg.markerColor,
        glowColor: cfg.glowColor,
        markerElevation: cfg.markerElevation,
        markers: cfg.markers.map((m) => ({ location: m.location, size: cfg.markerSize, id: m.id })),
        arcs: cfg.arcs.map((a) => ({ from: a.from, to: a.to, id: a.id })),
        arcColor: cfg.arcColor,
        arcWidth: cfg.arcWidth,
        arcHeight: cfg.arcHeight,
        opacity: 0.7,
      })

      function animate() {
        const c = configRef.current
        if (!globe) return

        if (!isPausedRef.current) {
          phi += c.speed
          if (Math.abs(velocity.current.phi) > 0.0001 || Math.abs(velocity.current.theta) > 0.0001) {
            phiOffsetRef.current += velocity.current.phi
            thetaOffsetRef.current += velocity.current.theta
            velocity.current.phi *= 0.95
            velocity.current.theta *= 0.95
          }
          const thetaMin = -0.4
          const thetaMax = 0.4
          if (thetaOffsetRef.current < thetaMin) {
            thetaOffsetRef.current += (thetaMin - thetaOffsetRef.current) * 0.1
          } else if (thetaOffsetRef.current > thetaMax) {
            thetaOffsetRef.current += (thetaMax - thetaOffsetRef.current) * 0.1
          }
        }

        globe.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: c.theta + thetaOffsetRef.current + dragOffset.current.theta,
          dark: c.dark,
          mapBrightness: c.mapBrightness,
          markerColor: c.markerColor,
          baseColor: c.baseColor,
          arcColor: c.arcColor,
          markerElevation: c.markerElevation,
          markers: c.markers.map((m) => ({ location: m.location, size: c.markerSize, id: m.id })),
          arcs: c.arcs.map((a) => ({ from: a.from, to: a.to, id: a.id })),
        })
        animationId = requestAnimationFrame(animate)
      }

      animate()
      window.setTimeout(() => {
        if (el) el.style.opacity = "1"
      })
    }

    if (canvas.offsetWidth > 0) {
      initGlobe(canvas)
    } else {
      resizeObserver = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width ?? 0
        if (w > 0 && !globe) {
          resizeObserver?.disconnect()
          resizeObserver = null
          initGlobe(canvas)
        }
      })
      resizeObserver.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      resizeObserver?.disconnect()
      resizeObserver = null
      if (globe) {
        globe.destroy()
        globe = null
      }
    }
  }, [])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {markers.map((m) => (
        <div
          key={m.id}
          style={{
            position: "absolute",
            positionAnchor: `--cobe-${m.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: 8,
            padding: "2px 6px",
            background: "#1a1a2e",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            whiteSpace: "nowrap" as const,
            pointerEvents: "none" as const,
            opacity: `var(--cobe-visible-${m.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
            transition: "opacity 0.8s, filter 0.8s",
          }}
        >
          {m.label}
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translate3d(-50%, -1px, 0)",
              border: "5px solid transparent",
              borderTopColor: "#1a1a2e",
            }}
          />
        </div>
      ))}
    </div>
  )
}
