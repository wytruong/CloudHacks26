## Vault
### Autonomous Account Takeover Detection & Response — UCI CloudHacks 2026

> "Vault doesn't just detect one attack. It scores risky logins with explainable AI, blocks the obvious ones fast, and pulls humans in only when the signal is ambiguous."

---

## The Problem

By the time an end user finds out their account was compromised, the damage is often done. Existing tools detect threats but still require a human to investigate and respond manually. That takes hours. Attackers need seconds.

**Average cost of a data breach: $4.88M. Average detection time: 194 days.**

Vault closes that gap by scoring each login with Amazon Bedrock, persisting state in DynamoDB, notifying stakeholders over SNS, and streaming verdicts to a SOC war room over API Gateway WebSockets — with Amazon Rekognition as a safety net on borderline scores.

---

## What Vault Does

Vault is an **autonomous login-risk pipeline** that ingests login events (via an HTTP API on API Gateway), analyzes them with **Amazon Bedrock (Claude Sonnet 4.6)**, stores results in **Amazon DynamoDB**, sends **real email** via **Amazon SNS** (including OTP codes for human-in-the-loop steps), and pushes structured incidents to the **React SOC dashboard** in real time over **API Gateway WebSockets**. For **60–89% confidence** events, the analyst flow can trigger **Amazon Rekognition** face comparison against reference photos in **Amazon S3** (`vault-reference-photos`), with OTP verification handled by a second Lambda.

### Confidence Threshold System
| Confidence | Action | Human Needed? |
|---|---|---|
| 90%+ | Auto-block, notify user, generate report | ❌ None |
| 60–89% | Rekognition selfie check → analyst confirms | ✅ One click |
| Below 60% | Silent flag, low priority queue | 🔍 Review later |

---

## Demo Scenarios

**Single account attack (97% confidence — fully autonomous):**
2AM login from Bucharest, Romania. Last login Irvine CA 6 hours ago. 5,700 miles apart. Device unknown. MFA failed. Blocked in seconds; SNS email alert; incident appears on the SOC war room with full reasoning.

**Borderline case (71% confidence — Rekognition):**
Login from Singapore, known device but unusual hour. Rekognition requests a selfie against the S3 reference gallery. Wrong face → auto-block. Real user → mark safe after OTP verification.

---

## Architecture

```
Simulation script (fire-events.py)
        ↓
API Gateway HTTP → Lambda: vault-receive-event
        ↓
Amazon Bedrock (Claude Sonnet 4.6) — threat analysis + confidence
        ↓
Amazon DynamoDB (vault-events, vault-connections, vault-otp)
        ↓
Amazon SNS — email alerts (BLOCK) + OTP delivery
        ↓
API Gateway WebSocket — push incident payload → Next.js SOC dashboard

Borderline path (60–89%):
  Frontend camera capture
        ↓
Amazon Rekognition (+ reference photos in S3: vault-reference-photos)
        ↓
Lambda: vault-verify-otp — OTP / verification step
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Next.js, Tailwind CSS, shadcn/ui, COBE globe, Framer Motion |
| Screens | Login (lamp effect), SOC war room dashboard, incident report |
| AI analysis | Amazon Bedrock — Claude Sonnet 4.6 |
| Face verification | Amazon Rekognition + Amazon S3 (`vault-reference-photos`) |
| Compute | AWS Lambda (`vault-receive-event`, `vault-verify-otp`) |
| Database | Amazon DynamoDB (`vault-events`, `vault-connections`, `vault-otp`) |
| Notifications | Amazon SNS (BLOCK alerts, OTP codes) |
| APIs | API Gateway WebSocket (real-time UI), API Gateway HTTP (simulation / ingest) |
| Region | us-west-2 |

---

## Team

| Name | Role | Owns |
|---|---|---|
| My Truong | Frontend + Full Stack | Next.js app (3 screens), WebSocket client, simulation → HTTP API wiring, end-to-end demo |
| Jenny | AWS / ML integration | Amazon Rekognition flow for 60–89% confidence verification |

---

## API Contract

```json
POST /api/login-event
{
  "accountId": "j***@definitelysafe.co",
  "ip": "185.220.101.47",
  "location": [44.4268, 26.1025],
  "city": "Bucharest",
  "country": "RO",
  "deviceFingerprint": "unknown",
  "mfaPassed": false,
  "timestamp": "2026-04-18T02:01:00Z"
}

WebSocket Response:
{
  "confidence": 97,
  "verdict": "BLOCK",
  "tier": "auto",
  "reasoning": [
    "Last login: Irvine CA, 2:14pm PST",
    "Current login: Bucharest RO, 2:01am EET",
    "Distance: 5,700 miles in 6 hours — physically impossible",
    "Device fingerprint: NO MATCH",
    "MFA: NOT PASSED",
    "Verdict: BLOCK SESSION"
  ],
  "coordinatedAttack": false,
  "affectedAccounts": [],
  "action": "auto-blocked",
  "reportId": "INC-2047",
  "agentSteps": [
    { "agent": "Triage", "status": "complete", "score": 97 },
    { "agent": "CrossAccount", "status": "complete", "found": 0 },
    { "agent": "Decision", "status": "complete", "action": "BLOCK" }
  ]
}
```

---

## Repo Structure

```
CloudHacks26/
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js routes (/, /dashboard, /report)
│   │   ├── components/
│   │   │   ├── sentinel/        # login-screen, soc-war-room
│   │   │   └── ui/              # shadcn + lamp, COBE globe, etc.
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts  # WebSocket URL + incident mapping
│   │   └── lib/
│   │       └── soc-data.ts      # types + seed copy
│   └── package.json
├── simulation/
│   └── fire-events.py           # POSTs demo events to API Gateway HTTP
└── README.md
```

## Track Targets

- **AWS Track** — Primary (Lambda, Bedrock, DynamoDB, API Gateway WebSocket + HTTP, SNS, S3, Rekognition)
- **Best AI Safety Track** — Secondary (explainable reasoning from Bedrock, human-in-the-loop + Rekognition on 60–89% band)

---

UCI CloudHacks 2026 — 72 hours — April 17–20, 2026

## Getting Started

**Prerequisites:** Node.js 20+, npm, and (optional) Python 3 with `requests` for the simulation script.

**Run the frontend (SOC UI):**

```bash
git clone https://github.com/wytruong/CloudHacks26
cd CloudHacks26/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Use `/` for the lamp login, `/dashboard` for the war room, and `/report` for the incident report view.

**Real-time data:** the dashboard expects the deployed API Gateway WebSocket endpoint configured in `frontend/src/hooks/useWebSocket.ts`. Point that constant at your own stage if you redeploy the backend.

**Fire demo login events:**

```bash
cd CloudHacks26/simulation
python3 -m pip install requests   # once, if needed
python3 fire-events.py
```

The script posts a sequence of synthetic logins to the HTTP API that invokes `vault-receive-event` (URL is defined at the top of `fire-events.py` — update it if your API changes).
## 🌐 Live Demo

https://vault-cloudhacks.vercel.app
