"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const STORAGE_KEY = "vault-selected-incident"

export type VaultReportIncident = {
  accountId: string
  city: string
  country: string
  confidence: number
  verdict: string
  reasoning: string[]
  timestamp: string
}

function isVaultReportIncident(x: unknown): x is VaultReportIncident {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return (
    typeof o.accountId === "string" &&
    typeof o.city === "string" &&
    typeof o.country === "string" &&
    typeof o.confidence === "number" &&
    Number.isFinite(o.confidence) &&
    typeof o.verdict === "string" &&
    Array.isArray(o.reasoning) &&
    o.reasoning.every((line) => typeof line === "string") &&
    typeof o.timestamp === "string"
  )
}

function countryLabel(code: string): string {
  const c = code.trim().toUpperCase()
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(c) ?? c
  } catch {
    return c
  }
}

function statusFromVerdict(verdict: string): "BLOCKED" | "WARN" | "FLAG" {
  const v = verdict.trim().toUpperCase()
  if (v === "BLOCK" || v === "BLOCKED") return "BLOCKED"
  if (v === "WARN" || v === "REVIEW" || v === "SAFE") return "WARN"
  return "FLAG"
}

function formatReportId(timestamp: string): string {
  const t = Date.parse(timestamp)
  if (Number.isNaN(t)) return "INC-VIEW"
  return `INC-${(t % 1_000_000).toString().padStart(6, "0")}`
}

function formatTimeline(
  timestamp: string,
  city: string,
  countryName: string,
  confidence: number,
  verdict: string
): [string, string][] {
  const base = Date.parse(timestamp)
  if (Number.isNaN(base)) {
    return [["—", "Invalid incident timestamp"]]
  }
  const fmt = (ms: number) =>
    new Date(ms).toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  return [
    [fmt(base - 8_000), "Last known-good session — Irvine CA"],
    [fmt(base - 6_000), "Anomalous authentication burst observed"],
    [fmt(base - 5_000), "Amazon Bedrock triage — geo, device, and MFA signals evaluated"],
    [fmt(base - 4_000), "Cross-account correlation scan completed"],
    [
      fmt(base - 3_000),
      `Hostile session correlated to ${city}, ${countryName} (${verdict}, ${confidence}% confidence)`,
    ],
    [fmt(base - 1_000), "SNS notifications dispatched; WebSocket push to SOC dashboard"],
    [fmt(base), "Session disposition recorded in DynamoDB"],
  ]
}

function ReportPageInner() {
  const searchParams = useSearchParams()
  const [incident, setIncident] = useState<VaultReportIncident | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let parsed: unknown = null
    try {
      const q = searchParams.get("incident")
      if (q) {
        parsed = JSON.parse(decodeURIComponent(q)) as unknown
      } else if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) parsed = JSON.parse(raw) as unknown
      }
    } catch {
      parsed = null
    }
    if (isVaultReportIncident(parsed)) {
      setIncident(parsed)
    } else {
      setIncident(null)
    }
    setHydrated(true)
  }, [searchParams])

  const countryName = incident ? countryLabel(incident.country) : ""
  const status = incident ? statusFromVerdict(incident.verdict) : "BLOCKED"
  const reportId = incident ? formatReportId(incident.timestamp) : "INC-VIEW"

  const executiveParagraph = useMemo(() => {
    if (!incident) return ""
    const ts = new Date(incident.timestamp)
    const dateStr = Number.isNaN(ts.getTime())
      ? incident.timestamp
      : ts.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
    return `On ${dateStr}, Vault detected a high-velocity login risk for Definitely Safe Co identity (${incident.accountId}). Automated analysis correlated geo-velocity and device posture to isolate activity originating from ${incident.city}, ${countryName}. Amazon Bedrock scored the event at ${incident.confidence}% confidence with verdict ${incident.verdict}. Response actions were logged to DynamoDB with supporting artifacts in S3.`
  }, [incident, countryName])

  const timelineRows = useMemo(() => {
    if (!incident) return [] as [string, string][]
    return formatTimeline(
      incident.timestamp,
      incident.city,
      countryName,
      incident.confidence,
      incident.verdict
    )
  }, [incident, countryName])

  const technicalRows = useMemo(() => {
    if (!incident) return [] as [string, string][]
    return [
      ["Account", incident.accountId],
      ["City", incident.city],
      ["Country", countryName],
      ["Confidence", `${incident.confidence}%`],
      ["Verdict", incident.verdict],
      ["Status", status],
      ["Detected (UTC)", new Date(incident.timestamp).toISOString()],
      ["Signal Source", "Vault Lambda + Bedrock pipeline"],
    ] as const
  }, [incident, countryName, status])

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#000000] font-mono text-sm text-[#9ca3af]">
        Loading report…
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#000000] px-4 text-center">
        <p className="font-mono text-sm text-[#9ca3af]">No incident selected. Open a case in the SOC dashboard and choose View Full Report.</p>
        <Link
          href="/dashboard"
          className="font-mono text-xs text-[#ef4444] underline-offset-4 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="report-container flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#000000] text-[#ffffff]">
      <style media="print">{`
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    background: #000000 !important;
  }

  .no-print {
    display: none !important;
  }

  html,
  body {
    height: auto !important;
    overflow: visible !important;
  }

  .report-container {
    height: auto !important;
    overflow: visible !important;
    max-height: none !important;
  }

  .report-content {
    overflow: visible !important;
    height: auto !important;
  }
}
      `}</style>
      <header
        className="no-print flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[#2a0a0a] bg-[#000000] px-4 py-4 md:px-8"
        style={{ borderBottomWidth: "0.5px" }}
      >
        <span
          className="font-mono text-[#ef4444]"
          style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.05em" }}
        >
          Vault
        </span>
        <h1 className="min-w-0 flex-1 text-center font-mono text-sm font-medium text-[#9ca3af] md:text-base">
          Incident Report #{reportId}
        </h1>
        <Button
          type="button"
          className="border-0 bg-[#ef4444] font-mono text-xs text-[#ffffff] hover:bg-[#dc2626]"
          onClick={() => typeof window !== "undefined" && window.print()}
        >
          Download Report
        </Button>
      </header>

      <div className="report-content min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <main className="mx-auto max-w-4xl space-y-4 px-4 py-8 md:px-8">
          <Card
            className="border border-[#2a0a0a] bg-[#0a0000] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardHeader className="bg-[#0a0000]">
              <CardTitle className="font-mono text-sm uppercase tracking-wide text-[#ef4444]">
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-[#9ca3af]">
              <p>{executiveParagraph}</p>
            </CardContent>
          </Card>

          <Card
            className="border border-[#2a0a0a] bg-[#0a0000] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardHeader className="bg-[#0a0000]">
              <CardTitle className="font-mono text-sm uppercase tracking-wide text-[#ef4444]">
                Attack Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative ms-2 border-s border-[#2a0a0a] ps-6 font-mono text-xs text-[#9ca3af]">
                {timelineRows.map(([t, body], idx) => (
                  <li key={idx} className="mb-6 last:mb-0">
                    <span className="absolute -start-[7px] mt-1.5 size-3 rounded-full border border-[#2a0a0a] bg-[#0a0000]" />
                    <p className="text-[#ef4444]">{t}</p>
                    <p className="mt-1 text-[#9ca3af]">{body}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card
            className="border border-[#2a0a0a] bg-[#0a0000] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardHeader className="bg-[#0a0000]">
              <CardTitle className="font-mono text-sm uppercase tracking-wide text-[#ef4444]">
                AI Agent Findings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[#9ca3af]">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-[#ffffff]">Bedrock analysis</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {incident.reasoning.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border border-[#2a0a0a] bg-[#0a0000] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardHeader className="bg-[#0a0000]">
              <CardTitle className="font-mono text-sm uppercase tracking-wide text-[#ef4444]">
                Actions Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-2 text-sm text-[#9ca3af]">
                {status === "BLOCKED" ? (
                  <>
                    <li>Session terminated at the identity provider edge.</li>
                    <li>User notified via Amazon SNS email alerts.</li>
                    <li>Forensic event bundle written to DynamoDB with artifacts in S3.</li>
                  </>
                ) : status === "WARN" ? (
                  <>
                    <li>Session held for analyst review; Rekognition / OTP path available per policy.</li>
                    <li>Stakeholders notified via Amazon SNS where configured.</li>
                    <li>Event record persisted to DynamoDB for audit.</li>
                  </>
                ) : (
                  <>
                    <li>Session flagged for low-priority review queue.</li>
                    <li>Telemetry retained in DynamoDB for trend analysis.</li>
                    <li>No automatic session revocation at current confidence tier.</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card
            className="border border-[#2a0a0a] bg-[#0a0000] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardHeader className="bg-[#0a0000]">
              <CardTitle className="font-mono text-sm uppercase tracking-wide text-[#ef4444]">
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-2 text-sm text-[#9ca3af]">
                <li>Enable mandatory phishing-resistant MFA for all workforce identities.</li>
                <li>Review IP allow/deny policies for high-risk ASN and Tor exit ranges.</li>
                <li>Monitor known Tor egress CIDR blocks with elevated step-up authentication.</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="border border-[#2a0a0a] bg-[#0a0000] shadow-none"
            style={{ borderWidth: "0.5px" }}
          >
            <CardHeader className="bg-[#0a0000]">
              <CardTitle className="font-mono text-sm uppercase tracking-wide text-[#ef4444]">
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse font-mono text-xs">
                <tbody className="text-[#9ca3af]">
                  {technicalRows.map(([k, v], i) => (
                    <tr
                      key={k}
                      className="border-b border-[#2a0a0a]/60 last:border-0"
                      style={{ backgroundColor: i % 2 === 0 ? "#000000" : "#0a0000" }}
                    >
                      <th className="bg-[#0a0000] py-2 pr-4 text-left font-medium text-[#ffffff]">{k}</th>
                      <td className="py-2 text-right text-[#ffffff] md:text-left">
                        {k === "Status" ? (
                          <span
                            className={
                              v === "BLOCKED"
                                ? "inline-block rounded-md border border-[#ef4444] bg-[#2a0a0a] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#ef4444]"
                                : v === "WARN"
                                  ? "inline-block rounded-md border border-amber-500/80 bg-[#2a0a0a] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-400"
                                  : "inline-block rounded-md border border-sky-500/80 bg-[#2a0a0a] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sky-300"
                            }
                            style={{ borderWidth: "0.5px" }}
                          >
                            {v}
                          </span>
                        ) : (
                          v
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>

      <footer className="no-print shrink-0 px-4 py-8 md:px-8">
        <Link
          href="/dashboard"
          className="font-mono text-xs text-[#ef4444] underline-offset-4 hover:underline"
        >
          Back to Dashboard
        </Link>
      </footer>

      <footer
        className="w-full shrink-0 bg-[#000000] px-6 py-4 text-center font-mono text-[11px] text-[#4b5563]"
        style={{ borderTop: "0.5px solid #2a0a0a" }}
      >
        {`Vault Security Platform · Generated ${new Date().toLocaleString()} · Incident #${reportId} · Confidential`}
      </footer>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-[#000000] font-mono text-sm text-[#9ca3af]">
          Loading report…
        </div>
      }
    >
      <ReportPageInner />
    </Suspense>
  )
}
