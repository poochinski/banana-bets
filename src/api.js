/**
 * Banana Bets data adapter.
 *
 * Today the UI falls back to demo data.
 * Later set VITE_API_BASE_URL in Railway and return JSON from either:
 *   Google Sheets -> Apps Script Web App -> this React app
 * or
 *   Google Sheets -> Node/Express API -> this React app
 *
 * Never put private Google credentials in VITE_ environment variables.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request(path) {
  if (!API_BASE_URL) return null;

  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Banana Bets API request failed (${response.status})`);
  }
  return response.json();
}

export function getDashboard(season, week) {
  return request(`/dashboard?season=${encodeURIComponent(season)}&week=${encodeURIComponent(week)}`);
}

export function getGames(season, week) {
  return request(`/games?season=${encodeURIComponent(season)}&week=${encodeURIComponent(week)}`);
}
