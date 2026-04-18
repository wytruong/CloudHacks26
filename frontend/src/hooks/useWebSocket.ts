"use client"

import { useEffect, useState } from "react"

import type { Arc, Marker } from "@/components/ui/cobe-globe"
import { type SocIncident, type Severity } from "@/lib/soc-data"

const WS_URL = "wss://4y8tbuqggh.execute-api.us-west-2.amazonaws.com/production"

const HQ_MARKER: Marker = {
  id: "hq",
  location: [33.6846, -117.8265],
  label: "Irvine CA — HQ",
}

const FLAG_BY_CC: Record<string, string> = {
  RO: "🇷🇴",
  SG: "🇸🇬",
  UK: "🇬🇧",
  GB: "🇬🇧",
  RU: "🇷🇺",
  NG: "🇳🇬",
  CA: "🇨🇦",
  US: "🇺🇸",
  DE: "🇩🇪",
  BR: "🇧🇷",
  AE: "🇦🇪",
  KR: "🇰🇷",
  IN: "🇮🇳",
  FR: "🇫🇷",
  AU: "🇦🇺",
}

const COORD_BY_CITY_CC: Record<string, [number, number]> = {
  "Bucharest|RO": [44.4268, 26.1025],
  "Singapore|SG": [1.3521, 103.8198],
  "London|UK": [51.5074, -0.1278],
  "London|GB": [51.5074, -0.1278],
  "Moscow|RU": [55.7558, 37.6173],
  "Lagos|NG": [6.5244, 3.3792],
  "Toronto|CA": [43.6532, -79.3832],
  "Berlin|DE": [52.52, 13.405],
  "São Paulo|BR": [-23.55, -46.63],
  "Dubai|AE": [25.2048, 55.2708],
  "Seoul|KR": [37.5665, 126.978],
  "Mumbai|IN": [19.076, 72.8777],
  "Paris|FR": [48.8566, 2.3522],
  "Sydney|AU": [-33.8688, 151.2093],
  "Chicago|US": [41.8781, -87.6298],
}

const COORD_BY_CC_ONLY: Record<string, [number, number]> = {
  RO: [44.4268, 26.1025],
  SG: [1.3521, 103.8198],
  UK: [51.5074, -0.1278],
  GB: [51.5074, -0.1278],
  RU: [55.7558, 37.6173],
  NG: [6.5244, 3.3792],
  CA: [43.6532, -79.3832],
  US: [41.8781, -87.6298],
  DE: [52.52, 13.405],
  BR: [-23.55, -46.63],
  AE: [25.2048, 55.2708],
  KR: [37.5665, 126.978],
  IN: [19.076, 72.8777],
  FR: [48.8566, 2.3522],
  AU: [-33.8688, 151.2093],
}

function severityFromConfidence(confidence: number): Severity {
  if (confidence >= 90) return "CRITICAL"
  if (confidence >= 60) return "WARN"
  return "INFO"
}

function flagForCountry(countryCode: string): string {
  const cc = countryCode.trim().toUpperCase()
  return FLAG_BY_CC[cc] ?? "🏴"
}

function coordsForLocation(city: string, countryCode: string): [number, number] {
  const cc = countryCode.trim().toUpperCase()
  const key = `${city}|${cc}`
  const byCity = COORD_BY_CITY_CC[key]
  if (byCity) return byCity
  const byCc = COORD_BY_CC_ONLY[cc]
  if (byCc) return byCc
  return [44.4268, 26.1025]
}

function mapWsPayloadToSocIncident(raw: unknown): SocIncident | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as Record<string, unknown>
  const id = typeof p.id === "string" ? p.id : String(p.id ?? "")
  const accountId = typeof p.accountId === "string" ? p.accountId : ""
  const city = typeof p.city === "string" ? p.city : ""
  const countryRaw = typeof p.country === "string" ? p.country : ""
  const countryCode = countryRaw.trim().toUpperCase() || "XX"
  const confidence = typeof p.confidence === "number" ? p.confidence : Number(p.confidence ?? 0)
  const reasoning = Array.isArray(p.reasoning)
    ? (p.reasoning as unknown[]).map((line) => String(line))
    : []

  if (!id) return null

  const [lat, lng] = coordsForLocation(city, countryCode)
  const markers: Marker[] = [
    HQ_MARKER,
    {
      id: "threat",
      location: [lat, lng],
      label: `${city} ${countryCode} — LIVE`,
    },
  ]
  const arcs: Arc[] = [
    {
      id: "arc-main",
      from: HQ_MARKER.location,
      to: [lat, lng],
    },
  ]

  return {
    id,
    emailRedacted: accountId,
    severity: severityFromConfidence(confidence),
    city,
    countryCode,
    flag: flagForCountry(countryCode),
    timeLabel: "just now",
    markers,
    arcs,
    reasoning,
  }
}

export function useWebSocket(initial: SocIncident[]) {
  const [incidents, setIncidents] = useState<SocIncident[]>(initial)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    ws.onopen = () => console.log("Vault WS connected")
    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data) as unknown
        const incident = mapWsPayloadToSocIncident(raw)
        if (incident) {
          setIncidents((prev) => [incident, ...prev])
        }
      } catch (e) {
        console.error("WS message parse error", e)
      }
    }
    ws.onerror = (err) => console.error("WS error", err)
    ws.onclose = () => console.log("WS closed")
    return () => ws.close()
  }, [])

  return { incidents, setIncidents }
}
