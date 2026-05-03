# SafeReach

Emergency response app for overdose situations. Built for first responders, bystanders, and families.

**Live:** https://safereach-theta.vercel.app

---

## What it does

**SOS** — tap the big button to start an emergency session. A timer starts and an AI companion (Reach) guides you step by step.

**Alert Contacts** — sends a message with your live GPS location and a one-tap join link to your emergency contacts.

**Symptom Scan** — take a photo, AI analyzes it and gives a risk level (HIGH / MEDIUM / LOW) + immediate actions to take.

**Live Map** — see nearby hospitals, pharmacies, and urgent care centers as markers on a real-time map. Tap any marker to get directions.

**Family Dashboard** — when someone clicks your alert link, they see your live location on a map, can message you, send voice notes, or call 911.

**Reach AI** — chat companion that guides the person in crisis. Knows if naloxone was given, what the camera scan found, and adapts its responses.

---

## Join flow

1. Victim taps SOS → alert sent with join link
2. Family/friend clicks link → enters their name → instantly sees victim's location on live map
3. No code to type, no account needed

---

## Stack

- React + Vite
- Leaflet (live maps)
- Claude AI (chat + vision)
- OpenStreetMap Overpass API (nearby POIs)
- Vercel (hosting + serverless API)

---

## Run locally

```bash
npm install
npm run dev
```

Add a `.env` file:
```
VITE_CLAUDE_API_KEY=your_key
VITE_GOOGLE_MAPS_API_KEY=your_key
```
