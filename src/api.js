/*
 * ============================================================
 * BANANA BETS API CLIENT
 * ============================================================
 *
 * This is the single frontend connection point between
 * React and the Banana Bets Apps Script API.
 *
 * React should NOT reproduce model calculations.
 * It only displays values returned by the model.
 * ============================================================
 */

export const API_BASE_URL =
  "https://script.google.com/macros/s/AKfycbyDg7ByaHsWvHRP7C4ZqZPIVIt40PGu83G5lna7quTenDR-kPi05d2Rt2ksl6n29nE/exec";

/**
 * Make a request to the Banana Bets API.
 */
async function bananaBetsRequest(params = {}) {
  const url = new URL(API_BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), { method: "GET" });

  if (!response.ok) {
    throw new Error(`Banana Bets API returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || "Banana Bets API returned an error.");
  }

  return data;
}

/** API health check. */
export function getApiHealth() {
  return bananaBetsRequest({ action: "health" });
}

/** Retrieve curated Bet Finder rows. */
export function getBetFinder({
  season,
  week,
  market = "moneyline",
  sportsbook = null,
  minEv = null,
  thresholdOnly = false,
  limit = 500
}) {
  return bananaBetsRequest({
    action: "betfinder",
    season,
    week,
    market,
    sportsbook,
    min_ev: minEv,
    threshold_only: thresholdOnly ? "true" : "false",
    limit
  });
}

/** Retrieve website-safe game output rows from 60_OUTPUT_GAMES. */
export function getGames({
  season,
  week,
  gameId = null,
  team = null,
  limit = 500
}) {
  return bananaBetsRequest({
    action: "games",
    season,
    week,
    game_id: gameId,
    team,
    limit
  });
}

/** Retrieve website-safe bet rows from 61_OUTPUT_BETS. */
export function getBets({
  season,
  week,
  gameId = null,
  team = null,
  market = null,
  sportsbook = null,
  minEv = null,
  thresholdOnly = false,
  limit = 500
}) {
  return bananaBetsRequest({
    action: "bets",
    season,
    week,
    game_id: gameId,
    team,
    market,
    sportsbook,
    min_ev: minEv,
    threshold_only: thresholdOnly ? "true" : "false",
    limit
  });
}

/** Retrieve component-model output for a game. */
export function getModelBreakdown({
  season = null,
  week = null,
  gameId = null,
  team = null,
  limit = 100
}) {
  return bananaBetsRequest({
    action: "modelbreakdown",
    season,
    week,
    game_id: gameId,
    team,
    limit
  });
}

/** Retrieve structured explanation rows for a game/team/market. */
export function getExplanations({
  season = null,
  week = null,
  gameId = null,
  team = null,
  market = null,
  confidence = null,
  limit = 500
}) {
  return bananaBetsRequest({
    action: "explanations",
    season,
    week,
    game_id: gameId,
    team,
    market,
    confidence,
    limit
  });
}

/** Retrieve held-out model performance output. */
export function getPerformance({
  testSeason = null,
  latestOnly = true,
  limit = 100
} = {}) {
  return bananaBetsRequest({
    action: "performance",
    test_season: testSeason,
    latest_only: latestOnly ? "true" : "false",
    limit
  });
}
