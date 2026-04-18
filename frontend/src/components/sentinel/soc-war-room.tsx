"use client"

import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { Check, LogOut } from "lucide-react"

import { Globe } from "@/components/ui/cobe-globe"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useWebSocket } from "@/hooks/useWebSocket"
import { INITIAL_INCIDENTS, type Severity } from "@/lib/soc-data"

const PIPELINE_STEP_MS = 600
const TYPEWRITER_MS = 800

const VERIFY_OTP_URL =
  "https://pou67ig3wd.execute-api.us-west-2.amazonaws.com/default/vault-verify-otp"

const EMPTY_OTP = ["", "", "", "", "", ""] as const

/** Stable tuple refs for Globe — inline arrays would change identity every render. */
const SOC_GLOBE_BASE: [number, number, number] = [0.32, 0.35, 0.4]
const SOC_GLOBE_MARKER: [number, number, number] = [0.2, 0.78, 0.9]
const SOC_GLOBE_GLOW: [number, number, number] = [0.02, 0.03, 0.06]

type PipelineStatus = "pending" | "active" | "complete"

function arcRgbForSeverity(s: Severity): [number, number, number] {
  if (s === "CRITICAL") return [0.93, 0.22, 0.22]
  if (s === "WARN") return [0.96, 0.58, 0.12]
  return [0.2, 0.55, 0.96]
}

function formatClock(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

const PIPELINE_TOOLTIPS: Record<string, string> = {
  "Triage Agent": "Scores the login event: location, device, time, MFA.",
  "Cross-Account Scan": "Checks if same IP hit other accounts.",
  "Decision Agent": "Makes final verdict and triggers response.",
}

const STAT_PILL_TOOLTIPS: Partial<Record<string, string>> = {
  "Active Threats": "Accounts currently under AI investigation.",
  "Blocked Today": "Sessions terminated by Vault today.",
  "Avg Response Time": "Average time from detection to action.",
}

const TOOLTIP_PANEL_CLASS =
  "pointer-events-none absolute bottom-full left-1/2 z-[80] mb-1.5 w-max max-w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 whitespace-normal border border-[#ef4444] bg-[#0a0000] px-2 py-1 text-center font-mono text-[11px] leading-snug text-[#9ca3af] opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"

function SocTooltip({ children, text, wrapperClassName }: { children: ReactNode; text: string; wrapperClassName?: string }) {
  return (
    <span className={wrapperClassName ? `group relative ${wrapperClassName}` : "group relative inline-flex max-w-full"}>
      {children}
      <span className={TOOLTIP_PANEL_CLASS} style={{ borderWidth: "0.5px", borderRadius: "4px" }} role="tooltip">
        {text}
      </span>
    </span>
  )
}

export function SocWarRoom() {
  const router = useRouter()
  const { incidents } = useWebSocket(INITIAL_INCIDENTS)
  const [selectedId, setSelectedId] = useState<string>("bucharest")
  const [now, setNow] = useState(() => new Date())
  const [pipeline, setPipeline] = useState<PipelineStatus[]>(["pending", "pending", "pending"])
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [showSelfie, setShowSelfie] = useState(false)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [safeIds, setSafeIds] = useState<Set<string>>(new Set())
  /** Incident already counted toward Active Threats reduction (block or safe, once). */
  const [mitigatedIds, setMitigatedIds] = useState<Set<string>>(new Set())
  const [activeThreatCount, setActiveThreatCount] = useState(4)
  const [blockedTodayCount, setBlockedTodayCount] = useState(12)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [otpDigits, setOtpDigits] = useState<string[]>(() => [...EMPTY_OTP])
  const [otpPhase, setOtpPhase] = useState<"entry" | "loading" | "success" | "failure">("entry")
  const isBlocked = blockedIds.has(selectedId)

  const pipelineTimers = useRef<number[]>([])
  const typewriterTimers = useRef<number[]>([])
  const toastTimerRef = useRef<number | null>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const blockAfterOtpFailRef = useRef<number | null>(null)

  const selected = useMemo(
    () => incidents.find((i) => i.id === selectedId) ?? incidents[0]!,
    [incidents, selectedId]
  )

  const globeMarkers = useMemo(() => selected.markers, [selected.markers])
  const globeArcs = useMemo(() => selected.arcs, [selected.arcs])
  const globeArcColor = useMemo(
    () => arcRgbForSeverity(selected.severity),
    [selected.severity]
  )

  const clearTimers = useCallback(() => {
    pipelineTimers.current.forEach((id) => window.clearTimeout(id))
    pipelineTimers.current = []
    typewriterTimers.current.forEach((id) => window.clearTimeout(id))
    typewriterTimers.current = []
  }, [])

  const runPipeline = useCallback(() => {
    clearTimers()
    setPipeline(["active", "pending", "pending"])
    const t1 = window.setTimeout(() => {
      setPipeline(["complete", "active", "pending"])
    }, PIPELINE_STEP_MS)
    pipelineTimers.current.push(t1)
    const t2 = window.setTimeout(() => {
      setPipeline(["complete", "complete", "active"])
    }, PIPELINE_STEP_MS * 2)
    pipelineTimers.current.push(t2)
    const t3 = window.setTimeout(() => {
      setPipeline(["complete", "complete", "complete"])
    }, PIPELINE_STEP_MS * 3)
    pipelineTimers.current.push(t3)
  }, [clearTimers])

  const runTypewriter = useCallback(
    (lines: string[], frozen: boolean) => {
      typewriterTimers.current.forEach((id) => window.clearTimeout(id))
      typewriterTimers.current = []
      setVisibleLines([])
      if (frozen) {
        return
      }
      lines.forEach((line, idx) => {
        const tid = window.setTimeout(() => {
          setVisibleLines((prev) => [...prev, line])
        }, TYPEWRITER_MS * (idx + 1))
        typewriterTimers.current.push(tid)
      })
    },
    []
  )

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) {
        window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
      if (blockAfterOtpFailRef.current != null) {
        window.clearTimeout(blockAfterOtpFailRef.current)
        blockAfterOtpFailRef.current = null
      }
    }
  }, [])

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current != null) {
      window.clearTimeout(toastTimerRef.current)
    }
    setToastMessage(message)
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null)
      toastTimerRef.current = null
    }, 3000)
  }, [])

  useEffect(() => {
    const frozen = blockedIds.has(selectedId)
    const kick = window.setTimeout(() => {
      setShowSelfie(false)
      if (frozen) {
        setPipeline(["complete", "complete", "complete"])
        setVisibleLines(selected.reasoning)
      } else {
        runPipeline()
        setVisibleLines([])
        runTypewriter(selected.reasoning, false)
      }
    }, 0)
    return () => {
      window.clearTimeout(kick)
      clearTimers()
    }
  }, [selectedId, selected.reasoning, runPipeline, runTypewriter, clearTimers, blockedIds])

  useEffect(() => {
    if (!selected.requiresSelfieReview || isBlocked) {
      const hide = window.setTimeout(() => setShowSelfie(false), 0)
      return () => window.clearTimeout(hide)
    }
    if (visibleLines.length < selected.reasoning.length) {
      const hide = window.setTimeout(() => setShowSelfie(false), 0)
      return () => window.clearTimeout(hide)
    }
    const t = window.setTimeout(() => setShowSelfie(true), 400)
    return () => window.clearTimeout(t)
  }, [visibleLines.length, selected.requiresSelfieReview, selected.reasoning.length, isBlocked])

  useEffect(() => {
    if (!showSelfie || !selected.requiresSelfieReview) return
    setOtpDigits([...EMPTY_OTP])
    setOtpPhase("entry")
    if (blockAfterOtpFailRef.current != null) {
      window.clearTimeout(blockAfterOtpFailRef.current)
      blockAfterOtpFailRef.current = null
    }
    const id = window.requestAnimationFrame(() => {
      otpInputRefs.current[0]?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [showSelfie, selected.requiresSelfieReview, selectedId])

  function onSelectRow(id: string) {
    setSelectedId(id)
    setShowSelfie(false)
  }

  function onBlockSession() {
    const wasAlreadyBlocked = blockedIds.has(selectedId)
    setBlockedIds((prev) => new Set(prev).add(selectedId))
    setSafeIds((prev) => {
      const n = new Set(prev)
      n.delete(selectedId)
      return n
    })
    if (!wasAlreadyBlocked) {
      setBlockedTodayCount((c) => c + 1)
    }
    if (!mitigatedIds.has(selectedId)) {
      setMitigatedIds((prev) => new Set(prev).add(selectedId))
      setActiveThreatCount((c) => Math.max(0, c - 1))
    }
    showToast("Session terminated. User notified.")
  }

  function onMarkSafe() {
    setBlockedIds((prev) => {
      const n = new Set(prev)
      n.delete(selectedId)
      return n
    })
    setSafeIds((prev) => new Set(prev).add(selectedId))
    if (!mitigatedIds.has(selectedId)) {
      setMitigatedIds((prev) => new Set(prev).add(selectedId))
      setActiveThreatCount((c) => Math.max(0, c - 1))
    }
    showToast("Session verified. Marked as safe.")
  }

  function setOtpDigitAt(index: number, digit: string) {
    setOtpDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
  }

  function onOtpChange(index: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1)
    setOtpDigitAt(index, d)
    if (d && index < 5) {
      window.requestAnimationFrame(() => {
        otpInputRefs.current[index + 1]?.focus()
      })
    }
  }

  function onOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace") return
    if (e.currentTarget.value) return
    e.preventDefault()
    if (index <= 0) return
    setOtpDigitAt(index - 1, "")
    window.requestAnimationFrame(() => {
      otpInputRefs.current[index - 1]?.focus()
    })
  }

  async function onVerifyOtp() {
    const otp = otpDigits.join("")
    if (otp.length !== 6 || otpPhase === "loading") return
    setOtpPhase("loading")
    try {
      const res = await fetch(VERIFY_OTP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selected.emailRedacted,
          otp,
        }),
      })
      const data = (await res.json()) as { verified?: boolean }
      if (data.verified === true) {
        if (blockAfterOtpFailRef.current != null) {
          window.clearTimeout(blockAfterOtpFailRef.current)
          blockAfterOtpFailRef.current = null
        }
        setOtpPhase("success")
        onMarkSafe()
        return
      }
      setOtpPhase("failure")
      if (blockAfterOtpFailRef.current != null) {
        window.clearTimeout(blockAfterOtpFailRef.current)
      }
      blockAfterOtpFailRef.current = window.setTimeout(() => {
        onBlockSession()
        blockAfterOtpFailRef.current = null
      }, 3000)
    } catch {
      setOtpPhase("failure")
      if (blockAfterOtpFailRef.current != null) {
        window.clearTimeout(blockAfterOtpFailRef.current)
      }
      blockAfterOtpFailRef.current = window.setTimeout(() => {
        onBlockSession()
        blockAfterOtpFailRef.current = null
      }, 3000)
    }
  }

  return (
    <div className="relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-[#000000] text-[#ffffff]">
      {toastMessage != null && (
        <div
          className="pointer-events-none fixed right-4 top-20 z-[60] max-w-sm rounded-md border border-[#7f1d1d] bg-[#0a0000]/95 px-4 py-3 font-mono text-xs text-[#ffffff] shadow-lg backdrop-blur-sm"
          style={{ borderWidth: "1px" }}
          role="status"
        >
          {toastMessage}
        </div>
      )}
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-4 px-4 py-3 md:px-6"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(12px)",
          borderBottom: "0.5px solid rgba(239, 68, 68, 0.3)",
        }}
      >
        <span
          className="text-[#ef4444]"
          style={{
          fontFamily: "var(--font-inter), Inter, sans-serif",
          fontSize: "20px",
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
        >
          Vault
        </span>
        <span className="min-w-0 flex-1 truncate px-2 text-center text-xs text-[#9ca3af] sm:text-sm">
          Definitely Safe Co — Security Operations.
        </span>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <span className="text-[#9ca3af]">
            Analyst: <span className="text-[#ffffff]">My Truong</span>
          </span>
          <span className="font-mono text-[#ef4444]">{formatClock(now)}</span>
          <span className="flex items-center gap-2">
            <span
              className="sentinel-live-dot size-[7px] shrink-0 rounded-full bg-[#ef4444]"
              aria-hidden
            />
            <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#ef4444]">
              LIVE
            </span>
          </span>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex shrink-0 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[11px] text-[#9ca3af] hover:text-[#ef4444]"
          >
            <LogOut className="size-3.5 shrink-0" aria-hidden />
            Sign Out
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 divide-y divide-[#2a0a0a] border-[#2a0a0a] overflow-hidden lg:grid-cols-12 lg:grid-rows-1 lg:divide-x lg:divide-y-0 lg:divide-[#2a0a0a]">
        {/* Left — accounts */}
        <aside className="flex min-h-0 max-h-[50dvh] flex-col overflow-hidden bg-[linear-gradient(to_bottom,#050000,#000000)] lg:col-span-3 lg:h-full lg:max-h-none">
          <div className="shrink-0 px-3 py-3">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#9ca3af]">
              Accounts at Risk
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex flex-col gap-2">
              {incidents.map((inc) => {
                const isSel = inc.id === selectedId
                const isWs = inc.id.startsWith("ws-")
                const blocked = blockedIds.has(inc.id)
                const safe = safeIds.has(inc.id) && !blocked
                const pulseBucharest = inc.id === "bucharest" && isSel && !blocked && !safe
                const leftBorder =
                  isSel
                    ? "#ef4444"
                    : safe
                      ? "#6b7280"
                      : inc.severity === "CRITICAL"
                        ? "#7f1d1d"
                        : inc.severity === "WARN"
                          ? "#92400e"
                          : "#6b7280"
                return (
                  <li key={inc.id}>
                    <button
                      type="button"
                      onClick={() => onSelectRow(inc.id)}
                      className={[
                        "w-full rounded-md border border-[#2a0a0a] p-3 text-left transition-colors",
                        isSel
                          ? "bg-[linear-gradient(to_right,#1a0000,#0a0000)]"
                          : "bg-[linear-gradient(to_right,#0f0000,#0a0000)] hover:bg-[linear-gradient(to_right,#1a0000,#0a0000)]",
                        isWs ? "sentinel-fade-in" : "",
                        pulseBucharest ? "sentinel-row-pulse" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        borderLeftWidth: isSel ? "2px" : "3px",
                        borderLeftStyle: "solid",
                        borderLeftColor: leftBorder,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate font-mono text-xs text-[#ffffff]">{inc.emailRedacted}</span>
                        {blocked ? (
                          <Badge
                            variant="secondary"
                            className="border-[#2a0a0a] bg-[#0a0000] font-mono text-[10px] uppercase tracking-wide text-[#9ca3af]"
                          >
                            BLOCKED
                          </Badge>
                        ) : safe ? (
                          <Badge
                            variant="secondary"
                            className="border-[#2a0a0a] bg-[#0a0000] font-mono text-[10px] uppercase tracking-wide text-[#22c55e]"
                          >
                            VERIFIED
                          </Badge>
                        ) : (
                          <SocTooltip
                            text={
                              inc.severity === "CRITICAL"
                                ? "90%+ confidence. Session auto-blocked by Bedrock AI."
                                : inc.severity === "WARN"
                                  ? "60-89% confidence. Awaiting analyst confirmation."
                                  : "Below 60% confidence. Silently monitored."
                            }
                            wrapperClassName="inline-flex shrink-0"
                          >
                            <Badge
                              variant="outline"
                              className={[
                                "border-[0.5px] font-mono text-[10px] uppercase tracking-wide",
                                inc.severity === "CRITICAL" &&
                                  "border-[#ef4444] bg-[#2a0a0a] text-[#ef4444]",
                                inc.severity === "WARN" &&
                                  "border-[#f59e0b] bg-[#1a0800] text-[#f59e0b]",
                                inc.severity === "INFO" &&
                                  "border-[#6b7280] bg-[#0a0a0a] text-[#9ca3af]",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {inc.severity}
                            </Badge>
                          </SocTooltip>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#9ca3af]">
                        <span>
                          {inc.flag} {inc.city} {inc.countryCode}
                        </span>
                        <span className="font-mono">{inc.timeLabel}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <div
            className="shrink-0 bg-[#050000] text-center font-mono text-[10px] text-[#4b5563]"
            style={{ borderTop: "0.5px solid #2a0a0a", padding: "8px 12px" }}
          >
            Vault v1.0 · UCI CloudHacks 2026
          </div>
        </aside>

        {/* Center */}
        <main className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-y-contain bg-[#000000] px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:col-span-6 lg:px-4">
          <div className="group relative mx-auto w-full max-w-md shrink-0">
            <Globe
              markers={globeMarkers}
              arcs={globeArcs}
              dark={1}
              baseColor={SOC_GLOBE_BASE}
              markerColor={SOC_GLOBE_MARKER}
              arcColor={globeArcColor}
              glowColor={SOC_GLOBE_GLOW}
              mapBrightness={10}
              markerElevation={0.01}
              speed={0.002}
              theta={0.2}
              className="w-full"
            />
            <span className={TOOLTIP_PANEL_CLASS} style={{ borderWidth: "0.5px", borderRadius: "4px" }} role="tooltip">
              Live global login activity for Definitely Safe Co.
            </span>
          </div>
          <div className="flex justify-center">
            <SocTooltip
              text="Active threat detected. AI investigation in progress."
              wrapperClassName="inline-flex"
            >
              <span className="sentinel-threat-badge inline-flex items-center rounded-md border border-[#ef4444] bg-[#2a0a0a] px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#ef4444]">
                THREAT DETECTED
              </span>
            </SocTooltip>
          </div>

          <div
            className="rounded-lg border border-[#2a0a0a] p-4"
            style={{
              borderWidth: "0.5px",
              backgroundImage:
                "linear-gradient(to right, rgb(239 68 68 / 1), transparent), linear-gradient(to right, #1a0000, #000000)",
              backgroundSize: "100% 1px, 100% 100%",
              backgroundPosition: "top left, 0 0",
              backgroundRepeat: "no-repeat, no-repeat",
            }}
          >
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
              Agent Pipeline
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              {(["Triage Agent", "Cross-Account Scan", "Decision Agent"] as const).map((label, idx) => {
                const st = pipeline[idx]!
                return (
                  <div key={label} className="flex flex-1 items-center gap-2">
                    <SocTooltip text={PIPELINE_TOOLTIPS[label]!} wrapperClassName="flex min-w-0 flex-1">
                      <div
                        className={[
                          "flex min-h-[52px] w-full flex-1 flex-col justify-center rounded-md border px-2 py-2 text-center font-mono text-[11px] leading-tight",
                          st === "pending" &&
                            "border-[0.5px] border-[#2a0a0a] bg-[linear-gradient(to_bottom,#0a0000,#000000)] text-[#9ca3af]",
                          st === "active" &&
                            "sentinel-step-pulse border-[0.5px] border-[#2a0a0a] bg-[linear-gradient(to_bottom,#0a0000,#000000)] text-[#9ca3af]",
                          st === "complete" &&
                            "border-[0.5px] border-[#ef4444] bg-[linear-gradient(to_bottom,#1a0000,#0a0000)] text-[#ef4444]",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className="flex items-center justify-center gap-1">
                          {st === "complete" && <Check className="size-3.5 shrink-0 text-[#ef4444]" />}
                          {label}
                        </span>
                      </div>
                    </SocTooltip>
                    {idx < 2 && (
                      <span className="hidden font-mono text-[#7f1d1d] sm:inline" aria-hidden>
                        →
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="min-h-[140px] shrink-0 rounded-lg border border-[#2a0a0a] bg-[#0a0000] p-4 font-mono text-xs leading-relaxed text-[#ef4444]"
            style={{ borderWidth: "0.5px" }}
          >
            {visibleLines.map((line) => (
              <p key={line} className="border-b border-[#2a0a0a]/80 py-1 text-[#ef4444] last:border-0">
                {line}
              </p>
            ))}
            {!isBlocked && visibleLines.length === 0 && (
              <p className="text-[#9ca3af]">Awaiting agent trace…</p>
            )}
          </div>

          {showSelfie && selected.requiresSelfieReview && (
            <Card
              className="shrink-0 border border-[#2a0a0a] bg-[#0a0000] shadow-none"
              style={{ borderWidth: "0.5px" }}
            >
              <CardContent className="space-y-3 pt-4">
                {otpPhase === "success" ? (
                  <div className="flex items-center gap-2 font-mono text-sm text-[#22c55e]">
                    <Check className="size-5 shrink-0" aria-hidden />
                    <span>Identity confirmed. Marking safe.</span>
                  </div>
                ) : (
                  <>
                    <p className="font-mono text-[12px] text-[#ef4444]">IDENTITY VERIFICATION REQUIRED</p>
                    <p className="text-[11px] text-[#9ca3af]">
                      A 6-digit code has been sent to the account owner&apos;s email.
                    </p>
                    <div className="flex justify-center gap-2">
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpInputRefs.current[i] = el
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          disabled={otpPhase === "loading" || otpPhase === "failure"}
                          onChange={(e) => onOtpChange(i, e.target.value)}
                          onKeyDown={(e) => onOtpKeyDown(i, e)}
                          className="text-center font-mono text-[18px] text-[#ffffff] outline-none focus-visible:ring-1 focus-visible:ring-[#ef4444]"
                          style={{
                            width: "36px",
                            height: "44px",
                            background: "#0a0000",
                            border: "0.5px solid #ef4444",
                            borderRadius: "4px",
                          }}
                          aria-label={`Digit ${i + 1}`}
                        />
                      ))}
                    </div>
                    {otpPhase === "failure" ? (
                      <p className="font-mono text-sm text-[#ef4444]">
                        Invalid or expired code. Session will be blocked.
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      disabled={otpPhase === "loading" || otpPhase === "failure" || otpDigits.join("").length !== 6}
                      className="w-full border-0 bg-[#ef4444] font-mono text-sm text-[#ffffff] hover:bg-[#dc2626] disabled:opacity-60"
                      onClick={() => void onVerifyOtp()}
                    >
                      {otpPhase === "loading" ? "Verifying..." : "Verify Identity"}
                    </Button>
                    <button
                      type="button"
                      disabled={otpPhase === "loading" || otpPhase === "failure"}
                      className="w-full border-0 bg-transparent p-0 text-center font-mono text-[11px] text-[#9ca3af] underline-offset-2 hover:underline disabled:opacity-50"
                      onClick={() => {
                        setOtpDigits([...EMPTY_OTP])
                        window.requestAnimationFrame(() => {
                          otpInputRefs.current[0]?.focus()
                        })
                      }}
                    >
                      Send new code
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex shrink-0 flex-col gap-2 pb-2 sm:flex-row">
            <SocTooltip
              text="Terminate session and notify user via email."
              wrapperClassName="flex min-w-0 flex-1 flex-col sm:flex-1"
            >
              <Button
                type="button"
                className="w-full flex-1 border-0 bg-[#ef4444] text-white hover:bg-[#ef4444]/90"
                onClick={onBlockSession}
              >
                Block Session
              </Button>
            </SocTooltip>
            <SocTooltip
              text="Whitelist this device and clear the threat flag."
              wrapperClassName="flex min-w-0 flex-1 flex-col sm:flex-1"
            >
              <Button
                type="button"
                className="w-full flex-1 border-0 bg-[#22c55e] text-white hover:bg-[#22c55e]/90"
                onClick={onMarkSafe}
              >
                Mark Safe
              </Button>
            </SocTooltip>
          </div>
        </main>

        {/* Right */}
        <aside className="flex min-h-0 flex-col gap-3 bg-[#050000] p-3 lg:col-span-3">
          <Card
            className="border border-[#2a0a0a] bg-[#0a0000] shadow-none"
            style={{ borderWidth: "0.5px", borderLeftWidth: "3px", borderLeftColor: "#ef4444" }}
          >
            <CardContent className="space-y-2 pt-4 font-mono text-[11px] leading-relaxed text-[#9ca3af]">
              <div className="flex items-center justify-between text-[#ffffff]">
                <span>Vault Bot</span>
                <span className="text-[10px] text-[#9ca3af]">now</span>
              </div>
              <p className="text-[10px] uppercase tracking-wide text-[#ef4444]">#security-alerts</p>
              <p className="text-[#ffffff]">
                Unusual velocity login for {selected.emailRedacted} from {selected.city}. Automated triage
                engaged — review in Vault.
              </p>
            </CardContent>
          </Card>

          <Card
            className="border border-[#2a0a0a] bg-[#0a0000] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardContent className="space-y-2 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-wide text-[#9ca3af]">Email preview</p>
              <p className="text-sm font-medium text-[#ffffff]">Unusual login detected on your account</p>
              <p className="text-xs text-[#9ca3af]">
                We blocked a suspicious session from {selected.city}, {selected.countryCode}. If this was not you,
                no action is required.
              </p>
              <p className="font-mono text-[11px] text-[#9ca3af]">To: {selected.emailRedacted}</p>
            </CardContent>
          </Card>

          <div className="group relative">
            <Card
              className="border border-[#7f1d1d] bg-[#0a0000] shadow-none"
              style={{ borderWidth: "0.5px" }}
            >
              <CardContent className="space-y-3 pt-4">
                <Badge className="border-0 bg-[#2a0a0a] font-mono text-[10px] uppercase tracking-wide text-[#ef4444] hover:bg-[#2a0a0a]">
                  Incident Resolved
                </Badge>
                <dl className="grid grid-cols-1 gap-2 font-mono text-[11px] text-[#9ca3af]">
                  <div className="flex justify-between gap-2">
                    <dt>Response Time</dt>
                    <dd className="text-[#ffffff]">4s</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Records Protected</dt>
                    <dd className="text-[#ffffff]">3000</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Damage Avoided</dt>
                    <dd className="text-[#ffffff]">$47000</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Logged</dt>
                    <dd className="text-[#ffffff]">DynamoDB + S3</dd>
                  </div>
                </dl>
                <Button
                  type="button"
                  className="w-full border-0 bg-[#ef4444] font-mono text-xs text-[#ffffff] hover:bg-[#dc2626]"
                  onClick={() => router.push("/report")}
                >
                  View Full Report
                </Button>
              </CardContent>
            </Card>
            <span className={TOOLTIP_PANEL_CLASS} style={{ borderWidth: "0.5px", borderRadius: "4px" }} role="tooltip">
              Threat neutralized. Report logged to DynamoDB + S3.
            </span>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pb-2">
            {[
              ["847", "Accounts Monitored"],
              [String(activeThreatCount), "Active Threats"],
              [String(blockedTodayCount), "Blocked Today"],
              ["3.2s", "Avg Response Time"],
            ].map(([k, label]) => {
              const pillTip = STAT_PILL_TOOLTIPS[label]
              return (
                <div
                  key={label}
                  className={
                    pillTip
                      ? "group relative min-w-[calc(50%-4px)] flex-1 rounded-full border border-[#2a0a0a] bg-[#0a0000] px-2 py-2 text-center font-mono text-[10px] text-[#9ca3af] sm:min-w-0"
                      : "min-w-[calc(50%-4px)] flex-1 rounded-full border border-[#2a0a0a] bg-[#0a0000] px-2 py-2 text-center font-mono text-[10px] text-[#9ca3af] sm:min-w-0"
                  }
                  style={{ borderWidth: "0.5px" }}
                >
                  <span className="block text-sm font-semibold text-[#ffffff]">{k}</span>
                  {label}
                  {pillTip ? (
                    <span className={TOOLTIP_PANEL_CLASS} style={{ borderWidth: "0.5px", borderRadius: "4px" }} role="tooltip">
                      {pillTip}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
