# Vault — Backend (AWS Lambda)

## Lambda Functions

### vault-receive-event
**Trigger:** API Gateway HTTP POST + WebSocket  
**Region:** us-west-2

Receives login events, analyzes them with Amazon Bedrock (Claude Sonnet 4.6 + Guardrails), stores results in DynamoDB, pushes real-time updates via WebSocket, sends SNS email alerts for BLOCK events, generates OTP codes for CONFIRM events, and handles Rekognition face verification requests.

**AWS Services Used:**
- Amazon Bedrock (Claude Sonnet 4.6) — AI threat analysis
- Amazon Bedrock Guardrails — AI safety layer
- Amazon DynamoDB (vault-events, vault-connections, vault-otp) — event storage
- Amazon API Gateway WebSocket — real-time push to frontend
- Amazon SNS — email alerts and OTP delivery
- Amazon Rekognition — face verification
- Amazon S3 (vault-reference-photos) — reference photo storage

---

### vault-verify-otp
**Trigger:** API Gateway HTTP POST  
**Region:** us-west-2

Verifies 6-digit OTP codes submitted by users during the 60-89% confidence identity check. Looks up the stored OTP in DynamoDB, confirms it matches and hasn't been used, marks it as used on success.

**AWS Services Used:**
- Amazon DynamoDB (vault-otp) — OTP storage and verification

---

## DynamoDB Tables

| Table | Partition Key | Purpose |
|---|---|---|
| vault-events | accountId | Stores all login events and Bedrock analysis |
| vault-connections | connectionId | Tracks active WebSocket connections |
| vault-otp | accountId | Stores time-limited OTP codes |

---

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| https://tza8pyb17g.execute-api.us-west-2.amazonaws.com/default/vault-receive-event | POST | Receive login events |
| https://pou67ig3wd.execute-api.us-west-2.amazonaws.com/default/vault-verify-otp | POST | Verify OTP codes |
| wss://4y8tbuqggh.execute-api.us-west-2.amazonaws.com/production | WebSocket | Real-time event push |

---

## S3 Buckets

| Bucket | Purpose |
|---|---|
| vault-reference-photos | Stores reference photos for Rekognition face verification |

---

## Confidence Threshold Logic

| Confidence | Verdict | Action |
|---|---|---|
| 90-100% | BLOCK | Auto-block + SNS email alert |
| 60-89% | CONFIRM | Send OTP + trigger Rekognition option |
| 0-59% | FLAG | Silent flag to dashboard |
