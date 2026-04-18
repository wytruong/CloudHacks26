import requests
import json
import time

LAMBDA_URL = "https://tza8pyb17g.execute-api.us-west-2.amazonaws.com/default/vault-receive-event"

events = [
    {
        "accountId": "j***@definitelysafe.co",
        "ip": "185.220.101.47",
        "city": "Bucharest",
        "country": "RO",
        "location": [44.4268, 26.1025],
        "deviceFingerprint": "unknown",
        "mfaPassed": False,
        "loginAttempts": 12,
        "lastKnownCity": "Irvine",
        "lastKnownCountry": "US"
    },
    {
        "accountId": "r***@definitelysafe.co",
        "ip": "91.108.56.11",
        "city": "Moscow",
        "country": "RU",
        "location": [55.7558, 37.6173],
        "deviceFingerprint": "unknown",
        "mfaPassed": False,
        "loginAttempts": 8,
        "lastKnownCity": "Irvine",
        "lastKnownCountry": "US"
    },
    {
        "accountId": "s***@definitelysafe.co",
        "ip": "103.21.244.0",
        "city": "Singapore",
        "country": "SG",
        "location": [1.3521, 103.8198],
        "deviceFingerprint": "known-device-sg",
        "mfaPassed": True,
        "loginAttempts": 1,
        "lastKnownCity": "Irvine",
        "lastKnownCountry": "US"
    },
    {
        "accountId": "k***@definitelysafe.co",
        "ip": "41.184.21.0",
        "city": "Lagos",
        "country": "NG",
        "location": [6.5244, 3.3792],
        "deviceFingerprint": "unknown",
        "mfaPassed": True,
        "loginAttempts": 2,
        "lastKnownCity": "Irvine",
        "lastKnownCountry": "US"
    },
    {
        "accountId": "m***@definitelysafe.co",
        "ip": "81.2.69.142",
        "city": "London",
        "country": "GB",
        "location": [51.5074, -0.1278],
        "deviceFingerprint": "known-device-uk",
        "mfaPassed": True,
        "loginAttempts": 1,
        "lastKnownCity": "London",
        "lastKnownCountry": "GB"
    },
    {
        "accountId": "t***@definitelysafe.co",
        "ip": "142.250.80.46",
        "city": "Toronto",
        "country": "CA",
        "location": [43.6532, -79.3832],
        "deviceFingerprint": "known-device-ca",
        "mfaPassed": True,
        "loginAttempts": 1,
        "lastKnownCity": "Toronto",
        "lastKnownCountry": "CA"
    }
]

print("🚨 Vault — Firing demo events...")
print("Make sure your dashboard is open at localhost:3000\n")

for i, event in enumerate(events):
    print(f"Firing event {i+1}/6: {event['accountId']} from {event['city']}, {event['country']}")
    try:
        response = requests.post(
            LAMBDA_URL,
            json=event,
            headers={"Content-Type": "application/json"}
        )
        print(f"  Response: {response.status_code}")
    except Exception as e:
        print(f"  Error: {e}")
    time.sleep(3)

print("\n✅ All events fired. Check your dashboard!")
