<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run the app locally

This contains everything you need to run your app locally.

This repo contains a simple in-browser meeting app.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Start signaling server (new terminal): `npm run signaling`
3. Run the app: `npm run dev`
   - Optional: set `VITE_SIGNALING_URL` env to a remote WS, else defaults to `ws://localhost:3001/ws`.
