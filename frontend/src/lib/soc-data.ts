import type { Arc, Marker } from "@/components/ui/cobe-globe"

export type Severity = "CRITICAL" | "WARN" | "INFO"

export interface SocIncident {
  id: string
  emailRedacted: string
  severity: Severity
  city: string
  countryCode: string
  flag: string
  timeLabel: string
  markers: Marker[]
  arcs: Arc[]
  reasoning: string[]
  requiresSelfieReview?: boolean
}

const HQ: Marker = {
  id: "hq",
  location: [33.6846, -117.8265],
  label: "Irvine CA — HQ",
}

function threatMarker(id: string, lat: number, lng: number, label: string): Marker {
  return { id, location: [lat, lng], label }
}

export const INITIAL_INCIDENTS: SocIncident[] = [
  {
    id: "bucharest",
    emailRedacted: "j***@acme.com",
    severity: "CRITICAL",
    city: "Bucharest",
    countryCode: "RO",
    flag: "🇷🇴",
    timeLabel: "just now",
    markers: [
      HQ,
      threatMarker("threat", 44.4268, 26.1025, "Bucharest RO — THREAT"),
    ],
    arcs: [
      {
        id: "arc-main",
        from: HQ.location,
        to: [44.4268, 26.1025],
      },
    ],
    reasoning: [
      "Last login: Irvine CA, 2:14pm PST",
      "Current login: Bucharest RO, 2:01am EET",
      "Distance: 5,700 miles in 6 hours — physically impossible",
      "Device fingerprint: NO MATCH",
      "MFA: NOT PASSED",
      "Cross-account scan: 0 related accounts found",
      "Confidence: 97% — Verdict: BLOCK SESSION.",
    ],
  },
  {
    id: "singapore",
    emailRedacted: "s***@acme.com",
    severity: "WARN",
    city: "Singapore",
    countryCode: "SG",
    flag: "🇸🇬",
    timeLabel: "3m ago",
    markers: [
      HQ,
      threatMarker("threat", 1.3521, 103.8198, "Singapore SG — REVIEW"),
    ],
    arcs: [{ id: "arc-main", from: HQ.location, to: [1.3521, 103.8198] }],
    reasoning: [
      "Last login: Irvine CA, 9:10am PST",
      "Current login: Singapore SG, 1:12am SGT",
      "Distance: 8,700 miles in 10 hours — unlikely travel",
      "Device fingerprint: PARTIAL MATCH",
      "MFA: PASSED (push)",
      "Cross-account scan: 1 low-risk alias",
      "Confidence: 71% — Rekognition selfie check required.",
    ],
    requiresSelfieReview: true,
  },
  {
    id: "london",
    emailRedacted: "m***@acme.com",
    severity: "INFO",
    city: "London",
    countryCode: "UK",
    flag: "🇬🇧",
    timeLabel: "7m ago",
    markers: [
      HQ,
      threatMarker("threat", 51.5074, -0.1278, "London UK — SIGNAL"),
    ],
    arcs: [{ id: "arc-main", from: HQ.location, to: [51.5074, -0.1278] }],
    reasoning: [
      "Last login: London UK, 6:02pm GMT",
      "Current login: London UK, 6:15pm GMT",
      "Distance: 12 miles — plausible",
      "Device fingerprint: MATCH",
      "MFA: PASSED",
      "Cross-account scan: no anomalies",
      "Confidence: 42% — Verdict: MONITOR.",
    ],
  },
  {
    id: "moscow",
    emailRedacted: "r***@acme.com",
    severity: "CRITICAL",
    city: "Moscow",
    countryCode: "RU",
    flag: "🇷🇺",
    timeLabel: "12m ago",
    markers: [
      HQ,
      threatMarker("threat", 55.7558, 37.6173, "Moscow RU — THREAT"),
    ],
    arcs: [{ id: "arc-main", from: HQ.location, to: [55.7558, 37.6173] }],
    reasoning: [
      "Last login: Irvine CA, 4:00pm PST",
      "Current login: Moscow RU, 3:05am MSK",
      "Distance: 6,100 miles in 5 hours — physically impossible",
      "Device fingerprint: NO MATCH",
      "MFA: NOT PASSED",
      "Cross-account scan: 2 related high-risk sessions",
      "Confidence: 94% — Verdict: BLOCK SESSION.",
    ],
  },
  {
    id: "lagos",
    emailRedacted: "k***@acme.com",
    severity: "WARN",
    city: "Lagos",
    countryCode: "NG",
    flag: "🇳🇬",
    timeLabel: "18m ago",
    markers: [
      HQ,
      threatMarker("threat", 6.5244, 3.3792, "Lagos NG — REVIEW"),
    ],
    arcs: [{ id: "arc-main", from: HQ.location, to: [6.5244, 3.3792] }],
    reasoning: [
      "Last login: Toronto CA, 11:30am EST",
      "Current login: Lagos NG, 5:45pm WAT",
      "Distance: 5,400 miles in 8 hours — high risk",
      "Device fingerprint: NEW DEVICE",
      "MFA: PASSED (SMS)",
      "Cross-account scan: 0 related accounts",
      "Confidence: 76% — Verdict: STEP-UP AUTH.",
    ],
  },
  {
    id: "toronto",
    emailRedacted: "t***@acme.com",
    severity: "INFO",
    city: "Toronto",
    countryCode: "CA",
    flag: "🇨🇦",
    timeLabel: "24m ago",
    markers: [
      HQ,
      threatMarker("threat", 43.6532, -79.3832, "Toronto CA — SIGNAL"),
    ],
    arcs: [{ id: "arc-main", from: HQ.location, to: [43.6532, -79.3832] }],
    reasoning: [
      "Last login: Irvine CA, 8:00am PST",
      "Current login: Toronto CA, 11:02am EST",
      "Distance: 2,100 miles — plausible flight",
      "Device fingerprint: MATCH",
      "MFA: PASSED",
      "Cross-account scan: clean",
      "Confidence: 38% — Verdict: LOG ONLY.",
    ],
  },
]

const RANDOM_LOCATIONS: Array<{
  city: string
  countryCode: string
  flag: string
  lat: number
  lng: number
}> = [
  { city: "Berlin", countryCode: "DE", flag: "🇩🇪", lat: 52.52, lng: 13.405 },
  { city: "São Paulo", countryCode: "BR", flag: "🇧🇷", lat: -23.55, lng: -46.63 },
  { city: "Dubai", countryCode: "AE", flag: "🇦🇪", lat: 25.2048, lng: 55.2708 },
  { city: "Seoul", countryCode: "KR", flag: "🇰🇷", lat: 37.5665, lng: 126.978 },
  { city: "Mumbai", countryCode: "IN", flag: "🇮🇳", lat: 19.076, lng: 72.8777 },
  { city: "Paris", countryCode: "FR", flag: "🇫🇷", lat: 48.8566, lng: 2.3522 },
  { city: "Sydney", countryCode: "AU", flag: "🇦🇺", lat: -33.8688, lng: 151.2093 },
  { city: "Chicago", countryCode: "US", flag: "🇺🇸", lat: 41.8781, lng: -87.6298 },
]

function randomSeverity(): Severity {
  const r = Math.random()
  if (r < 0.35) return "CRITICAL"
  if (r < 0.7) return "WARN"
  return "INFO"
}

function randomEmail(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz"
  const a = letters[Math.floor(Math.random() * 26)]
  return `${a}***@acme.com`
}

export function createSyntheticIncident(): SocIncident {
  const loc = RANDOM_LOCATIONS[Math.floor(Math.random() * RANDOM_LOCATIONS.length)]!
  const sev = randomSeverity()
  const confidence = Math.floor(55 + Math.random() * 44)
  const id = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const markers: Marker[] = [
    HQ,
    threatMarker("threat", loc.lat, loc.lng, `${loc.city} ${loc.countryCode} — LIVE`),
  ]
  const arcs: Arc[] = [{ id: "arc-main", from: HQ.location, to: [loc.lat, loc.lng] }]
  const verdict =
    sev === "CRITICAL"
      ? "BLOCK SESSION."
      : sev === "WARN"
        ? "STEP-UP AUTH REQUIRED."
        : "MONITOR."
  return {
    id,
    emailRedacted: randomEmail(),
    severity: sev,
    city: loc.city,
    countryCode: loc.countryCode,
    flag: loc.flag,
    timeLabel: "live",
    markers,
    arcs,
    reasoning: [
      `Streaming event from ${loc.city} ${loc.countryCode}`,
      "Velocity model: comparing against last known good session",
      "Risk features: geo-velocity + device reputation + MFA signals",
      `Heuristic score: ${confidence}%`,
      `Confidence: ${confidence}% — Verdict: ${verdict}`,
    ],
  }
}
