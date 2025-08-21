# Pet Activity Tracker

A micro-app to log pet activities, view a daily summary with a small animated data-vis, chat with a contextual memory bot, and get a UX prompt if no walk is logged by 18:00.

## Stack

- React + Vite (client)
- Node.js + Express (server)
- In-memory storage (no DB)

## Run locally

1) Server

```bash
cd server
npm install
npm run dev
```

2) Client (new terminal)

```bash
cd client
npm install
npm run dev
```

Open the client URL from the terminal output. Ensure the server is on `http://localhost:4000` or update `API_BASE` in `client/src/App.jsx`.

## Trade-offs

- In-memory data resets on restart; suitable for demo only.
- Chatbot is a simple contextual echo (no external AI).
- Single-file components for speed; would modularize for production.
