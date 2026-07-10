# Donation Alert Backend (Test Phase)

This is a proof-of-concept backend for a donation alert system designed for OBS, utilizing NestJS, Socket.IO, BullMQ, and Redis.

## Features

- **Queue-based processing**: Receives webhooks via REST API, pushes them to a BullMQ queue backed by Redis, to ensure the webhook endpoint responds immediately.
- **Real-time emitting**: A worker processes the queue and emits events directly to connected clients via Socket.IO.
- **OBS Browser Source Ready**: A simple overlay HTML page that can be added to OBS as a Browser Source to display real-time, non-overlapping animated alerts.

## Setup Instructions

1. **Prerequisites**: Ensure you have Node.js and Docker installed.
2. **Environment**: Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Set `STREAM_KEY` to any secret string you want. This acts as the authentication key for both the webhook submission and the overlay connection.
3. **Start Redis**:
   ```bash
   docker-compose up -d
   ```
4. **Install Dependencies**:
   ```bash
   npm install
   ```
5. **Run Application**:
   ```bash
   npm run start:dev
   ```

## Testing the Flow

1. **Open the Overlay**:
   In your browser, navigate to:
   `http://localhost:3000/overlay.html?key=<YOUR_STREAM_KEY>`
   Open your developer tools console; you should see "connected" logged.

2. **Trigger a Donation**:
   Open a new tab and navigate to:
   `http://localhost:3000/trigger.html`
   Enter your stream key, fill out the form, and click "Trigger Donation". You will see the alert pop up in the overlay window. If you trigger multiple, they will queue sequentially and not overlap.

## OBS Browser Source Integration

To add this to OBS Studio:

1. Under **Sources**, click `+` -> **Browser**.
2. Name it "Donation Alerts".
3. Check **Local file**: leave this unchecked.
4. **URL**: `http://localhost:3000/overlay.html?key=<YOUR_STREAM_KEY>` (Note: in a real environment, this would be a public domain).
5. **Width**: 800 (or as desired).
6. **Height**: 300 (or as desired).
7. **Use custom frame rate**: (Optional)
8. **Custom CSS**: Leave as default. The HTML itself defines `background: transparent !important;` to ensure OBS renders it transparently.
9. Click **OK**. Trigger a donation from `trigger.html` to see it on your stream!
