# Banana Bets

React + Vite PWA starter for the Banana Bets NFL betting-model website.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Data architecture

Google Sheets -> Apps Script or Node/Express API -> Banana Bets React app

The UI currently falls back to demo data. Set `VITE_API_BASE_URL` when the API is ready.

## Railway

This repository includes a `Dockerfile` and `Caddyfile` so Railway can build the Vite app and serve the `dist` folder as a single-page application.
