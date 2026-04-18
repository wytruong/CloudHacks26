"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"

import { Globe } from "@/components/ui/cobe-globe"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useWebSocket } from "@/hooks/useWebSocket"
import { INITIAL_INCIDENTS, type Severity } from "@/lib/soc-data"

const PIPELINE_STEP_MS = 600
const TYPEWRITER_MS = 800

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

export function SocWarRoom() {
  const router = useRouter()
  const { incidents } = useWebSocket(INITIAL_INCIDENTS)
  const [selectedId, setSelectedId] = useState<string>("bucharest")
  const [now, setNow] = useState(() => new Date())
  const [pipeline, setPipeline] = useState<PipelineStatus[]>(["pending", "pending", "pending"])
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [showSelfie, setShowSelfie] = useState(false)
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const isBlocked = blockedIds.has(selectedId)

  const pipelineTimers = useRef<number[]>([])
  const typewriterTimers = useRef<number[]>([])

  const selected = useMemo(
    () => incidents.find((i) => i.id === selectedId) ?? incidents[0]!,
    [incidents, selectedId]
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

  function onSelectRow(id: string) {
    setSelectedId(id)
    setShowSelfie(false)
  }

  function onBlockSession() {
    setBlockedIds((prev) => new Set(prev).add(selectedId))
  }

  function onMarkSafe() {
    setBlockedIds((prev) => {
      const n = new Set(prev)
      n.delete(selectedId)
      return n
    })
  }

  const arcColor = arcRgbForSeverity(selected.severity)

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0e1a] text-foreground">
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[#1e2a44] bg-[#0f1424] px-4 py-3 md:px-6"
        style={{ borderBottomWidth: "0.5px" }}
      >
        <span className="font-mono text-sm font-semibold tracking-wide text-[#4a9eff]">
          SENTINEL IQ
        </span>
        <span className="min-w-0 flex-1 truncate px-2 text-center text-xs text-muted-foreground sm:text-sm">
          Acme Corp — Security Operations.
        </span>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <span className="text-muted-foreground">
            Analyst: <span className="text-foreground">My Truong</span>
          </span>
          <span className="font-mono text-[#f59e0b]">{formatClock(now)}</span>
          <span className="flex items-center gap-2">
            <span
              className="sentinel-live-dot size-[7px] shrink-0 rounded-full bg-[#22c55e]"
              aria-hidden
            />
            <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-[#22c55e]">
              LIVE
            </span>
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 divide-y divide-[#1e2a44] border-[#1e2a44] lg:h-[calc(100dvh-57px)] lg:grid-cols-12 lg:divide-x lg:divide-y-0 lg:divide-[#1e2a44]">
        {/* Left — accounts */}
        <aside className="flex min-h-0 flex-col bg-[#0a0e1a] lg:col-span-3">
          <div className="shrink-0 px-3 py-3">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Accounts at Risk
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            <ul className="flex flex-col gap-2">
              {incidents.map((inc) => {
                const isSel = inc.id === selectedId
                const isWs = inc.id.startsWith("ws-")
                const blocked = blockedIds.has(inc.id)
                const pulseBucharest = inc.id === "bucharest" && isSel && !blocked
                return (
                  <li key={inc.id}>
                    <button
                      type="button"
                      onClick={() => onSelectRow(inc.id)}
                      className={[
                        "w-full rounded-md border border-[#1e2a44] bg-[#0f1424] p-3 text-left transition-colors hover:bg-[#12192c]",
                        isSel ? "ring-1 ring-[#1e2a44]" : "",
                        isWs ? "sentinel-fade-in" : "",
                        pulseBucharest ? "sentinel-row-pulse" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        borderLeftWidth: "3px",
                        borderLeftStyle: "solid",
                        borderLeftColor:
                          inc.severity === "CRITICAL"
                            ? "rgb(239 68 68 / 0.9)"
                            : inc.severity === "WARN"
                              ? "rgb(245 158 11 / 0.9)"
                              : "rgb(59 130 246 / 0.9)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate font-mono text-xs text-foreground">{inc.emailRedacted}</span>
                        {blocked ? (
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
                          >
                            BLOCKED
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={[
                              "font-mono text-[10px] uppercase tracking-wide",
                              inc.severity === "CRITICAL" && "border-[#ef4444]/40 text-[#ef4444]",
                              inc.severity === "WARN" && "border-[#f59e0b]/40 text-[#f59e0b]",
                              inc.severity === "INFO" && "border-[#3b82f6]/40 text-[#3b82f6]",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {inc.severity}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
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
        </aside>

        {/* Center */}
        <main className="flex min-h-0 flex-col gap-4 bg-[#0a0e1a] px-3 py-4 lg:col-span-6 lg:px-4">
          <div className="mx-auto w-full max-w-md shrink-0">
            <Globe
              markers={selected.markers}
              arcs={selected.arcs}
              dark={1}
              baseColor={[0.32, 0.35, 0.4]}
              markerColor={[0.2, 0.78, 0.9]}
              arcColor={arcColor}
              glowColor={[0.02, 0.03, 0.06]}
              mapBrightness={10}
              markerElevation={0.01}
              speed={0.003}
              theta={0.2}
              className="w-full"
            />
          </div>
          <div className="flex justify-center">
            <span className="sentinel-threat-badge inline-flex items-center rounded-md border border-[#ef4444]/50 bg-[#ef4444]/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#ef4444]">
              THREAT DETECTED
            </span>
          </div>

          <div className="rounded-lg border border-[#1e2a44] bg-[#0f1424] p-4" style={{ borderWidth: "0.5px" }}>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Agent Pipeline
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              {(["Triage Agent", "Cross-Account Scan", "Decision Agent"] as const).map((label, idx) => {
                const st = pipeline[idx]!
                return (
                  <div key={label} className="flex flex-1 items-center gap-2">
                    <div
                      className={[
                        "flex min-h-[52px] flex-1 flex-col justify-center rounded-md border px-2 py-2 text-center font-mono text-[11px] leading-tight",
                        st === "pending" && "border-[#1e2a44] bg-[#0a0e1a] text-muted-foreground",
                        st === "active" && "sentinel-step-pulse border-[#4a9eff]/70 bg-[#0a0e1a] text-[#4a9eff]",
                        st === "complete" && "border-[#22c55e]/40 bg-[#0a0e1a] text-[#22c55e]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {st === "complete" && <Check className="size-3.5 shrink-0 text-[#22c55e]" />}
                        {label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <span className="hidden font-mono text-muted-foreground sm:inline" aria-hidden>
                        →
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="min-h-[140px] flex-1 rounded-lg border border-[#1e2a44] bg-[#0f1424] p-4 font-mono text-xs leading-relaxed text-[#22c55e]"
            style={{ borderWidth: "0.5px" }}
          >
            {visibleLines.map((line) => (
              <p key={line} className="border-b border-[#1e2a44]/40 py-1 last:border-0">
                {line}
              </p>
            ))}
            {!isBlocked && visibleLines.length === 0 && (
              <p className="text-muted-foreground">Awaiting agent trace…</p>
            )}
          </div>

          {showSelfie && selected.requiresSelfieReview && (
            <Card
              className="border border-[#1e2a44] bg-[#0f1424] shadow-none"
              style={{ borderWidth: "0.5px" }}
            >
              <CardContent className="space-y-3 pt-4">
                <p className="font-mono text-xs text-foreground">Selfie verification requested</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    className="flex-1 border-0 bg-[#22c55e] text-white hover:bg-[#22c55e]/90"
                    onClick={() => setShowSelfie(false)}
                  >
                    Confirmed — Real User
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 border-0 bg-[#ef4444] text-white hover:bg-[#ef4444]/90"
                    onClick={onBlockSession}
                  >
                    Stranger Detected — Block
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-auto flex flex-col gap-2 pb-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1 border-0 bg-[#ef4444] text-white hover:bg-[#ef4444]/90"
              onClick={onBlockSession}
            >
              Block Session
            </Button>
            <Button
              type="button"
              className="flex-1 border-0 bg-[#22c55e] text-white hover:bg-[#22c55e]/90"
              onClick={onMarkSafe}
            >
              Mark Safe
            </Button>
          </div>
        </main>

        {/* Right */}
        <aside className="flex min-h-0 flex-col gap-3 bg-[#0a0e1a] p-3 lg:col-span-3">
          <Card
            className="border border-[#1e2a44] bg-[#0f1424] shadow-none"
            style={{ borderWidth: "0.5px", borderLeftWidth: "2px", borderLeftColor: "#a855f7" }}
          >
            <CardContent className="space-y-2 pt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <div className="flex items-center justify-between text-foreground">
                <span>SentinelIQ Bot</span>
                <span className="text-[10px] text-muted-foreground">now</span>
              </div>
              <p className="text-[10px] uppercase tracking-wide text-[#a855f7]">#security-alerts</p>
              <p className="text-foreground">
                Unusual velocity login for {selected.emailRedacted} from {selected.city}. Automated triage
                engaged — review in SentinelIQ.
              </p>
            </CardContent>
          </Card>

          <Card
            className="border border-[#1e2a44] bg-[#0f1424] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardContent className="space-y-2 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Email preview</p>
              <p className="text-sm font-medium text-foreground">Unusual login detected on your account</p>
              <p className="text-xs text-muted-foreground">
                We blocked a suspicious session from {selected.city}, {selected.countryCode}. If this was not you,
                no action is required.
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">To: {selected.emailRedacted}</p>
            </CardContent>
          </Card>

          <Card
            className="border border-[#14532d] bg-[#052e16] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardContent className="space-y-3 pt-4">
              <Badge className="border-0 bg-[#166534] font-mono text-[10px] uppercase tracking-wide text-white hover:bg-[#166534]">
                Incident Resolved
              </Badge>
              <dl className="grid grid-cols-1 gap-2 font-mono text-[11px] text-[#bbf7d0]">
                <div className="flex justify-between gap-2">
                  <dt>Response Time</dt>
                  <dd>4s</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Records Protected</dt>
                  <dd>3000</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Damage Avoided</dt>
                  <dd>$47000</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Logged</dt>
                  <dd>DynamoDB + S3</dd>
                </div>
              </dl>
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#22c55e]/40 font-mono text-xs text-[#bbf7d0] hover:bg-[#14532d]/50"
                onClick={() => router.push("/report")}
              >
                View Full Report
              </Button>
            </CardContent>
          </Card>

          <div className="mt-auto flex flex-wrap gap-2 pb-2">
            {[
              ["847", "Accounts Monitored"],
              ["4", "Active Threats"],
              ["12", "Blocked Today"],
              ["3.2s", "Avg Response Time"],
            ].map(([k, label]) => (
              <div
                key={label}
                className="min-w-[calc(50%-4px)] flex-1 rounded-full border border-[#1e2a44] bg-[#0f1424] px-2 py-2 text-center font-mono text-[10px] text-muted-foreground sm:min-w-0"
                style={{ borderWidth: "0.5px" }}
              >
                <span className="block text-sm font-semibold text-foreground">{k}</span>
                {label}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
