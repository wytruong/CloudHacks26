"use client"

import { useLayoutEffect, useRef } from "react"
import { motion, useAnimationFrame, useMotionValue, useTransform } from "motion/react"
import { wrap } from "@motionone/utils"

export interface TextMarqueProps {
  text: string
  baseVelocity: number
  className?: string
}

export function TextMarque({ text, baseVelocity, className }: TextMarqueProps) {
  const segmentRef = useRef<HTMLSpanElement>(null)
  const widthRef = useRef(280)
  const baseX = useMotionValue(0)

  const segment = `${text}\u00A0\u00A0`

  useLayoutEffect(() => {
    const el = segmentRef.current
    if (!el) return
    const w = el.offsetWidth
    if (w > 0) widthRef.current = w
  }, [text, className])

  useAnimationFrame((_, delta) => {
    baseX.set(baseX.get() + baseVelocity * (delta / 1000) * 80)
  })

  const x = useTransform(baseX, (v) => wrap(-widthRef.current, 0, v))

  return (
    <div className="w-full overflow-hidden py-1">
      <motion.div
        className="flex w-max whitespace-nowrap will-change-transform"
        style={{ x }}
      >
        <span ref={segmentRef} className={`inline-flex shrink-0 ${className ?? ""}`}>
          {segment}
        </span>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className={`inline-flex shrink-0 ${className ?? ""}`} aria-hidden>
            {segment}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
