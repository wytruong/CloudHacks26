## SentinelIQ
### Autonomous Account Takeover Detection & Response — UCI CloudHacks 2026

> "SentinelIQ doesn't just detect one attack. It recognizes when your entire platform is under coordinated attack — and shuts it down autonomously."

---

## The Problem

By the time an end user finds out their account was compromised, the damage is done. Existing tools detect threats but still require a human to investigate and respond manually. That takes hours. Attackers need seconds.

**Average cost of a data breach: $4.88M. Average detection time: 194 days.**

SentinelIQ closes that gap to 4 seconds.

---

## What SentinelIQ Does

SentinelIQ is an **autonomous multi-agent security system** powered by Amazon Bedrock AgentCore that detects suspicious login attempts, investigates them across your entire user base, and responds — all without human intervention for high-confidence threats.

It doesn't just flag threats. It thinks, coordinates, decides, and acts.

### Confidence Threshold System
| Confidence | Action | Human Needed? |
|---|---|---|
| 90%+ | Auto-block, notify user, generate report | ❌ None |
| 60–89% | Rekognition selfie check → analyst confirms | ✅ One click |
| Below 60% | Silent flag, low priority queue | 🔍 Review later |

---

## Demo Scenarios

**Single account attack (97% confidence — fully autonomous):**
2AM login from Bucharest, Romania. Last login Irvine CA 6 hours ago. 5,700 miles apart. Device unknown. MFA failed. Blocked in 4 seconds.

**Coordinated attack (Neptune graph detection):**
Same IP hits 12 accounts within 3 minutes. Neptune traverses the account graph, finds every connected node, mass-protects all 12 simultaneously.

**Borderline case (71% confidence — Rekognition):**
Login from Singapore, known device but unusual hour. Rekognition requests a selfie. Stranger's face → auto-block. Real user → mark safe.

---

## Architecture

```
End User Login Event
        ↓
Amazon Kinesis Data Streams
        ↓
Amazon EventBridge
        ↓
AWS Step Functions (orchestrates agent pipeline)
        ↓
Bedrock AgentCore — Multi-Agent Pipeline
  ├── Agent 1 — Triage (score individual event)
  ├── Agent 2 — Cross-Account Scan (Neptune graph)
  └── Agent 3 — Decision + Response
      90%+  → auto-block + notify + report
      60-89% → Rekognition selfie → analyst confirm
      <60%  → silent flag
        ↓
DynamoDB + S3
        ↓
API Gateway WebSocket → React SOC Dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, shadcn/ui, COBE |
| Real-time Ingestion | Amazon Kinesis Data Streams |
| Event Routing | Amazon EventBridge |
| Orchestration | AWS Step Functions |
| AI Agents | Amazon Bedrock AgentCore (Claude Sonnet 4.5) |
| Graph Detection | Amazon Neptune |
| Face Verification | Amazon Rekognition |
| Compute | AWS Lambda |
| Database | Amazon DynamoDB |
| Storage | Amazon S3 |
| Real-time Push | Amazon API Gateway WebSocket |
| Region | us-west-2 |

---

## Team

| Name | Role | Owns |
|---|---|---|
| My Truong | Frontend + Integration | 3 screens, COBE globe, WebSocket, demo |
| Jenny | AWS Backend | Kinesis, AgentCore, Neptune, Rekognition, Step Functions, DynamoDB |
| Person 3 | Data + Docs | demo-events.json, simulation script, Devpost, architecture diagram |

---

## API Contract

```json
POST /api/login-event
{
  "accountId": "j***@acme.com",
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
│   ├── components/ui/
│   │   ├── cobe-globe.tsx
│   │   └── cobe-globe-pulse.tsx
│   ├── screens/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── IncidentReport.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts
│   └── App.tsx
├── backend/
│   ├── kinesis-consumer/
│   ├── agents/
│   │   ├── triage-agent/
│   │   ├── cross-account-agent/
│   │   └── decision-agent/
│   ├── step-functions/pipeline.json
│   ├── rekognition/
│   └── websocket-api/
├── simulation/
│   ├── demo-events.json
│   └── fire-events.py
└── README.md
```

## Track Targets

- **AWS Track** — Primary (Kinesis + AgentCore + Neptune + Rekognition + Step Functions)
- **Best AI Safety Track** — Secondary (explainable AI, human-in-loop, Rekognition safety net, coordinated attack protection)

---

UCI CloudHacks 2026 — 72 hours — April 17–20, 2026
