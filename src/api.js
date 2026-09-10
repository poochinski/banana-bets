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

  const url =
    new URL(API_BASE_URL);


  Object.entries(params).forEach(
    ([key, value]) => {

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return;
      }

      url.searchParams.set(
        key,
        String(value)
      );
    }
  );


  const response =
    await fetch(
      url.toString(),
      {
        method: "GET"
      }
    );


  if (!response.ok) {

    throw new Error(
      `Banana Bets API returned HTTP ${response.status}`
    );
  }


  const data =
    await response.json();


  if (!data.ok) {

    throw new Error(
      data.message ||
      "Banana Bets API returned an error."
    );
  }


  return data;
}


/**
 * API health check.
 */
export function getApiHealth() {

  return bananaBetsRequest({
    action: "health"
  });
}


/**
 * Retrieve Bet Finder rows.
 */
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

    min_ev:
      minEv,

    threshold_only:
      thresholdOnly
        ? "true"
        : "false",

    limit
  });
}