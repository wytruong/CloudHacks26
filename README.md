# 🛡️ SentinelIQ
### Autonomous Account Takeover Detection & Response — UCI CloudHacks 2026

> "SentinelIQ gives security teams the right level of AI autonomy — fully automatic when it's obvious, human-confirmed when it's borderline, silent monitoring when it's low risk."

---

## 🚨 The Problem

By the time you find out your account was compromised — a breach email, a password reset you didn't request, weird charges — the attacker has already been inside for hours. Existing tools detect threats but still require a human to manually investigate and respond. That takes time. Time costs data.

**Last year alone, the average cost of a data breach was $4.88M. The average detection time was 194 days.**

---

## 💡 What SentinelIQ Does

SentinelIQ is an **autonomous security agent** powered by AWS Bedrock that detects suspicious login attempts, investigates them step-by-step, and responds — all in under 4 seconds.

It doesn't just flag threats. It thinks, decides, and acts.

### Confidence Threshold System
| Confidence | Action | Human Needed? |
|---|---|---|
| 90%+ | Auto-block session, notify user, generate report | ❌ None |
| 60–89% | Draft response, pause for analyst approval | ✅ One click |
| Below 60% | Silent flag in dashboard, low priority queue | 🔍 Review later |

---

## 🎯 Demo Scenario

A login attempt arrives at 2:01AM from Bucharest, Romania — 5,700 miles from the user's last known location in Irvine, CA. The same trip would take 6 hours by plane. The device fingerprint doesn't match. MFA was not passed.

**Bedrock's verdict: 97% confidence — BLOCK.**

The session is terminated in 4 seconds. The user gets notified. The incident report is auto-generated and stored. The analyst sees it all happen in real time on the SOC dashboard.

---

## 🏗️ Architecture

```
Login Event
    ↓
AWS Lambda (event receiver)
    ↓
Amazon Bedrock Agent (Claude Sonnet)
    ├── Investigate: check IP, location delta, device, time, MFA
    ├── Score: confidence 0–100
    ├── Decide: AUTO-BLOCK / CONFIRM / FLAG
    └── Act: block session + draft report + notify
    ↓
MongoDB Atlas (store events, reports, account history)
    ↓
Amazon S3 (store generated incident report PDFs)
    ↓
React Frontend (SOC Dashboard — real-time visualization)
```

---

## 🖥️ Product Screens

**Screen 1 — Login:** Enterprise SOC login page with animated COBE globe showing global login activity.

**Screen 2 — War Room:** 3-column SOC dashboard. Left: flagged accounts list. Center: interactive world globe tracing the attack path + Bedrock's live AI reasoning steps. Right: auto-drafted Slack alert, email preview, and damage outcome card.

**Screen 3 — Incident Report:** Auto-generated full incident report with executive summary, attack timeline, AI findings, actions taken, and recommendations. Ready to hand to a CISO.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, shadcn/ui |
| Globe Visualization | COBE (3D interactive WebGL globe) |
| AI Agent | Amazon Bedrock (Claude Sonnet) with tool use |
| Serverless Backend | AWS Lambda |
| Database | MongoDB Atlas |
| Storage | Amazon S3 |
| Region | us-west-2 |

---

## 👥 Team

| Name | Role |
|---|---|
| My Truong | Frontend Lead + Integration + Demo |
| Jenny | AWS Backend + Bedrock Agent + Lambda |
| TBD | Data Simulation + Devpost + Architecture Diagram |

---

## 📁 Repo Structure

```
CloudHacks26/
├── frontend/          # React + TypeScript + Tailwind app
│   ├── components/
│   │   └── ui/
│   │       ├── cobe-globe.tsx
│   │       └── cobe-globe-pulse.tsx
│   ├── screens/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── IncidentReport.tsx
│   └── App.tsx
├── backend/           # AWS Lambda functions
│   ├── receive-event/
│   ├── bedrock-agent/
│   └── generate-report/
├── simulation/        # Demo data + event scripts
│   └── demo-events.json
└── README.md
```

---

## 🔌 API Contract

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

Response:
{
  "confidence": 97,
  "verdict": "BLOCK",
  "reasoning": [
    "Last login: Irvine CA, 2:14pm PST",
    "Current login: Bucharest RO, 2:01am EET",
    "Distance: 5,700 miles in 6 hours — physically impossible",
    "Device fingerprint: NO MATCH",
    "MFA: NOT PASSED",
    "Verdict: BLOCK SESSION"
  ],
  "action": "auto-blocked",
  "reportId": "INC-2047"
}
```

---

## 🏆 Track Targets

- **AWS Track** — Primary (Bedrock + Lambda + S3 deeply integrated)
- **Best AI Safety Track** — Secondary (autonomous threat prevention, protecting user accounts)

---

## ⏱️ Hackathon

UCI CloudHacks 2026 — 72 hours — April 17–20, 2026
