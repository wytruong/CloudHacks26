"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff]">
      <header
        className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2a0a0a] bg-[#000000] px-4 py-4 md:px-8"
        style={{ borderBottomWidth: "0.5px" }}
      >
        <span className="font-mono text-sm font-semibold tracking-wide text-[#ef4444]">
          VAULT
        </span>
        <h1 className="min-w-0 flex-1 text-center font-mono text-sm font-medium text-[#9ca3af] md:text-base">
          Incident Report #INC-2047
        </h1>
        <Button
          type="button"
          className="border-0 bg-[#ef4444] font-mono text-xs text-[#ffffff] hover:bg-[#dc2626]"
          onClick={() => typeof window !== "undefined" && window.print()}
        >
          Download Report
        </Button>
      </header>

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
            <p>
              On April 17, 2026, Vault detected a high-velocity credential-stuffing attempt against Acme Corp
              identity infrastructure. Automated agents correlated geo-velocity, device reputation, and MFA posture
              to isolate a hostile session originating from a Tor exit node in Romania. The session was terminated
              within four seconds of triage with zero lateral movement observed.
            </p>
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
              {[
                ["14:12:08 PST", "Last known-good session — Irvine CA"],
                ["14:12:41 PST", "Anomalous authentication burst observed"],
                ["14:12:42 PST", "Triage Agent invoked (Bedrock AgentCore)"],
                ["14:12:44 PST", "Cross-account scan completed (Neptune graph)"],
                ["14:12:46 PST", "Decision Agent verdict: BLOCK (97% confidence)"],
                ["14:12:48 PST", "Session terminated + Slack + email notifications dispatched"],
              ].map(([t, body]) => (
                <li key={t} className="mb-6 last:mb-0">
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
              <p className="font-mono text-xs uppercase tracking-wide text-[#ffffff]">Triage Agent</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Impossible travel between Irvine CA and Bucharest RO within observed window.</li>
                <li>Device fingerprint mismatch vs. last five successful sessions.</li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-[#ffffff]">Cross-Account Scan</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>No correlated aliases with active privileged roles.</li>
                <li>Neptune path query returned zero lateral exposure edges.</li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-[#ffffff]">Decision Agent</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Weighted confidence 97%; policy match: immediate session revocation.</li>
                <li>Recommended follow-up: forced MFA reset + user outreach template #A-12.</li>
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
              <li>Session terminated at the identity provider edge.</li>
              <li>User notified via email and Slack #security-alerts.</li>
              <li>Forensic event bundle written to DynamoDB with artifacts in S3.</li>
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
                {(
                  [
                    ["Account", "j***@acme.com"],
                    ["IP", "185.220.101.47"],
                    ["ISP", "Tor Exit Node"],
                    ["Country", "Romania"],
                    ["Attack Type", "Credential Stuffing"],
                    ["Records at Risk", "3000"],
                    ["Confidence", "97%"],
                    ["Status", "BLOCKED"],
                  ] as const
                ).map(([k, v], i) => (
                  <tr
                    key={k}
                    className="border-b border-[#2a0a0a]/60 last:border-0"
                    style={{ backgroundColor: i % 2 === 0 ? "#000000" : "#0a0000" }}
                  >
                    <th className="bg-[#0a0000] py-2 pr-4 text-left font-medium text-[#ffffff]">{k}</th>
                    <td className="py-2 text-right text-[#ffffff] md:text-left">
                      {k === "Status" && v === "BLOCKED" ? (
                        <span
                          className="inline-block rounded-md border border-[#ef4444] bg-[#2a0a0a] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#ef4444]"
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

      <footer className="px-4 py-8 md:px-8">
        <Link
          href="/dashboard"
          className="font-mono text-xs text-[#ef4444] underline-offset-4 hover:underline"
        >
          Back to Dashboard
        </Link>
      </footer>
    </div>
  )
}
