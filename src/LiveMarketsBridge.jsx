import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { LineChart } from "lucide-react";
import { getBets, getBetFinder, getExplanations } from "./api";
import GameMarketValueFinder from "./components/GameMarketValueFinder";
import "./LiveMarketsBridge.css";

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pct(value, digits = 1) {
  const number = numberOrNull(value);
  return number === null ? "—" : `${(number * 100).toFixed(digits)}%`;
}

function signedPct(value, digits = 1) {
  const number = numberOrNull(value);
  if (number === null) return "—";
  return `${number >= 0 ? "+" : ""}${(number * 100).toFixed(digits)}%`;
}

function americanOdds(value) {
  const number = numberOrNull(value);
  if (number === null) return "—";
  const rounded = Math.round(number);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function displayBook(value) {
  if (!value) return "—";
  const aliases = {
    fanduel: "FanDuel",
    draftkings: "DraftKings",
    betmgm: "BetMGM",
    pinnacle: "Pinnacle"
  };
  return aliases[value] || String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function readTopbarSelection() {
  const seasonSelect = document.querySelector(".topbar .selector select");
  const weekSelect = document.querySelector(".topbar .week-selector select");
  const season = Number(seasonSelect?.value || 2026);
  const weekMatch = String(weekSelect?.value || "Week 1").match(/\d+/);
  return { season, week: weekMatch ? Number(weekMatch[0]) : 1 };
}

function marketSide(row) {
  return String(
    row?.team || row?.side || row?.selection || row?.bet_side || ""
  ).trim().toUpperCase();
}

function marketLine(row) {
  return numberOrNull(
    row?.line ?? row?.spread ?? row?.total ?? row?.market_line ?? row?.total_line
  );
}

function totalLabel(row) {
  if (!row) return "—";
  return `${marketSide(row) || "TOTAL"} ${marketLine(row) ?? "—"}`;
}

function uniqueBest(rows, market) {
  const best = new Map();

  rows.forEach((row) => {
    const key = [
      market,
      row.game_id,
      marketSide(row),
      marketLine(row)
    ].join("|");

    const current = best.get(key);

    if (
      !current ||
      Number(row.ev || -999) > Number(current.ev || -999)
    ) {
      best.set(key, row);
    }
  });

  return [...best.values()].sort(
    (a, b) => Number(b.ev || 0) - Number(a.ev || 0)
  );
}

async function loadMarketRows({ season, week, market, gameId = null, limit = 500 }) {
  const aliases = market === "spread"
    ? ["spread", "spreads"]
    : market === "total"
      ? ["total", "totals"]
      : [market];

  const errors = [];

  for (const alias of aliases) {
    try {
      const response = await getBets({
        season,
        week,
        gameId,
        market: alias,
        limit
      });

      const rows = Array.isArray(response?.rows)
        ? response.rows
        : [];

      if (rows.length) {
        return { rows, source: `61_OUTPUT_BETS · ${alias}`, error: "" };
      }
    } catch (error) {
      errors.push(error?.message || String(error));
    }
  }

  if (!gameId) {
    for (const alias of aliases) {
      try {
        const response = await getBetFinder({
          season,
          week,
          market: alias,
          limit
        });

        const rows = Array.isArray(response?.rows)
          ? response.rows
          : [];

        if (rows.length) {
          return { rows, source: `03_BET_FINDER · ${alias}`, error: "" };
        }
      } catch (error) {
        errors.push(error?.message || String(error));
      }
    }
  }

  return {
    rows: [],
    source: "",
    error: errors.length
      ? `No ${market} rows loaded. ${errors[0]}`
      : `The API returned zero ${market} rows for ${season} Week ${week}.`
  };
}

function ensureAfter(id, selector) {
  let host = document.getElementById(id);
  const target = document.querySelector(selector);

  if (!target?.parentNode) return null;

  if (!host) {
    host = document.createElement("div");
    host.id = id;
    host.className = "banana-market-portal-host";
  }

  if (
    host.parentNode !== target.parentNode ||
    host.previousSibling !== target
  ) {
    target.parentNode.insertBefore(host, target.nextSibling);
  }

  return host;
}

function ensureBefore(id, selector) {
  let host = document.getElementById(id);
  const target = document.querySelector(selector);

  if (!target?.parentNode) return null;

  if (!host) {
    host = document.createElement("div");
    host.id = id;
    host.className = "banana-market-portal-host";
  }

  if (
    host.parentNode !== target.parentNode ||
    host.nextSibling !== target
  ) {
    target.parentNode.insertBefore(host, target);
  }

  return host;
}

function DashboardMarkets({
  spreadRows,
  totalRows,
  spreadError,
  totalError,
  loading,
  builderLegIds
}) {
  return (
    <div className="dashboard-live-market-finders">
      <GameMarketValueFinder
        market="spread"
        rows={spreadRows}
        loading={loading}
        error={spreadError}
        builderLegIds={builderLegIds}
      />

      <GameMarketValueFinder
        market="total"
        rows={totalRows}
        loading={loading}
        error={totalError}
        builderLegIds={builderLegIds}
      />
    </div>
  );
}

function TotalExplanation({ row }) {
  if (!row) return null;

  return (
    <div className="matchup-total-explanation">
      <div>
        <strong>{String(row.team || row.side || "TOTAL").toUpperCase()}</strong>
        <span className={`confidence-badge ${String(row.confidence || "low").toLowerCase()}`}>
          {String(row.confidence || "—").toUpperCase()}
        </span>
      </div>
      <p>Primary: <b>{row.primary_factor || "—"}</b> {numberOrNull(row.primary_factor_value) !== null ? Number(row.primary_factor_value).toFixed(2) : ""}</p>
      <p>Secondary: <b>{row.secondary_factor || "—"}</b> {numberOrNull(row.secondary_factor_value) !== null ? Number(row.secondary_factor_value).toFixed(2) : ""}</p>
    </div>
  );
}

function MatchupTotals({ rows, explanations, loading, error }) {
  const best = useMemo(
    () => uniqueBest(rows, "total").slice(0, 4),
    [rows]
  );

  const uniqueExplanations = useMemo(() => {
    const seen = new Set();

    return explanations.filter((row) => {
      const key = `${row.team}-${row.primary_factor}-${row.secondary_factor}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 2);
  }, [explanations]);

  return (
    <section className="panel matchup-standard-panel matchup-total-market-panel">
      <div className="panel-header matchup-standard-header">
        <div>
          <span className="panel-kicker">TOTAL MARKET</span>
          <h2>Over / Under Value</h2>
          <p>The same live total probabilities, fair prices and EV values shown on the dashboard, scoped to this matchup.</p>
        </div>
        <LineChart size={22} />
      </div>

      {error ? (
        <div className="finder-confidence-warning">
          <strong>API note:</strong> {error}
        </div>
      ) : null}

      <div className="matchup-total-table">
        <div className="matchup-total-head">
          <span>Selection</span><span>Book</span><span>Odds</span><span>Model</span><span>Fair Odds</span><span>EV</span><span>Confidence</span>
        </div>

        {loading ? (
          <div className="matchup-total-loading">Loading total market…</div>
        ) : best.length ? (
          best.map((row, index) => (
            <div className="matchup-total-row" key={`${row.game_id}-${marketSide(row)}-${row.sportsbook}-${marketLine(row)}-${index}`}>
              <strong>{totalLabel(row)}</strong>
              <span>{displayBook(row.sportsbook)}</span>
              <strong>{americanOdds(row.american_odds)}</strong>
              <strong>{pct(row.model_win_prob ?? row.model_prob)}</strong>
              <strong>{americanOdds(row.fair_odds)}</strong>
              <strong className={Number(row.ev) >= 0 ? "green-value" : "red-value"}>{signedPct(row.ev)}</strong>
              <span className={`confidence-badge ${String(row.confidence || "low").toLowerCase()}`}>{String(row.confidence || "—").toUpperCase()}</span>
            </div>
          ))
        ) : (
          <div className="matchup-total-loading">No total rows returned for this matchup.</div>
        )}
      </div>

      {uniqueExplanations.length ? (
        <div className="matchup-total-explanation-grid">
          {uniqueExplanations.map((row, index) => (
            <TotalExplanation key={`${row.team}-${index}`} row={row} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function readBuilderLegIds() {
  try {
    const raw = localStorage.getItem("banana-bets-builder-v1");
    const legs = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(legs) ? legs.map((leg) => leg.id).filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

export default function LiveMarketsBridge() {
  const [{ season, week }, setSelection] = useState(() => readTopbarSelection());
  const [gameId, setGameId] = useState(() => sessionStorage.getItem("banana-bets:selected-matchup") || "");
  const [spreadRows, setSpreadRows] = useState([]);
  const [totalRows, setTotalRows] = useState([]);
  const [spreadError, setSpreadError] = useState("");
  const [totalError, setTotalError] = useState("");
  const [matchupTotalRows, setMatchupTotalRows] = useState([]);
  const [matchupTotalError, setMatchupTotalError] = useState("");
  const [totalExplanations, setTotalExplanations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchupLoading, setMatchupLoading] = useState(false);
  const [dashboardHost, setDashboardHost] = useState(null);
  const [matchupHost, setMatchupHost] = useState(null);
  const [builderLegIds, setBuilderLegIds] = useState(() => readBuilderLegIds());

  useEffect(() => {
    const refreshBuilderIds = (event) => {
      if (event?.detail?.id) {
        setBuilderLegIds((current) => {
          const next = new Set(current);
          next.add(event.detail.id);
          return next;
        });
      } else {
        setBuilderLegIds(readBuilderLegIds());
      }
    };

    window.addEventListener("banana-bets:add-builder-leg", refreshBuilderIds);
    window.addEventListener("storage", refreshBuilderIds);

    return () => {
      window.removeEventListener("banana-bets:add-builder-leg", refreshBuilderIds);
      window.removeEventListener("storage", refreshBuilderIds);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = readTopbarSelection();
      setSelection((current) =>
        current.season === next.season && current.week === next.week
          ? current
          : next
      );

      const nextGame = sessionStorage.getItem("banana-bets:selected-matchup") || "";
      setGameId((current) => current === nextGame ? current : nextGame);

      const moneylineFinder = document.querySelector(".main-dashboard.full-width-dashboard");
      if (moneylineFinder) {
        setDashboardHost(
          ensureAfter(
            "banana-live-market-finders",
            ".main-dashboard.full-width-dashboard"
          )
        );
      } else {
        document.getElementById("banana-live-market-finders")?.remove();
        setDashboardHost(null);
      }

      const matchupStats = document.querySelector("#matchup-stats");
      if (matchupStats) {
        setMatchupHost(
          ensureBefore(
            "banana-matchup-totals-host",
            "#matchup-stats"
          )
        );
      } else {
        document.getElementById("banana-matchup-totals-host")?.remove();
        setMatchupHost(null);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSpreadError("");
    setTotalError("");

    Promise.all([
      loadMarketRows({ season, week, market: "spread", limit: 500 }),
      loadMarketRows({ season, week, market: "total", limit: 500 })
    ]).then(([spreadResult, totalResult]) => {
      if (cancelled) return;
      setSpreadRows(spreadResult.rows);
      setTotalRows(totalResult.rows);
      setSpreadError(spreadResult.error);
      setTotalError(totalResult.error);
      setLoading(false);
    }).catch((error) => {
      if (cancelled) return;
      const message = error?.message || "Could not load spread/total markets.";
      setSpreadError(message);
      setTotalError(message);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [season, week]);

  useEffect(() => {
    if (!gameId) {
      setMatchupTotalRows([]);
      setTotalExplanations([]);
      setMatchupTotalError("");
      return undefined;
    }

    let cancelled = false;
    setMatchupLoading(true);
    setMatchupTotalError("");

    Promise.allSettled([
      loadMarketRows({ season, week, gameId, market: "total", limit: 30 }),
      getExplanations({ gameId, market: "total", limit: 20 })
    ]).then((results) => {
      if (cancelled) return;

      if (results[0].status === "fulfilled") {
        setMatchupTotalRows(results[0].value.rows);
        setMatchupTotalError(results[0].value.error);
      } else {
        setMatchupTotalRows([]);
        setMatchupTotalError(results[0].reason?.message || "Could not load totals for this matchup.");
      }

      setTotalExplanations(
        results[1].status === "fulfilled"
          ? results[1].value?.rows || []
          : []
      );

      setMatchupLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [gameId, season, week]);

  return (
    <>
      {dashboardHost ? createPortal(
        <DashboardMarkets
          spreadRows={spreadRows}
          totalRows={totalRows}
          spreadError={spreadError}
          totalError={totalError}
          loading={loading}
          builderLegIds={builderLegIds}
        />,
        dashboardHost
      ) : null}

      {matchupHost ? createPortal(
        <MatchupTotals
          rows={matchupTotalRows}
          explanations={totalExplanations}
          loading={matchupLoading}
          error={matchupTotalError}
        />,
        matchupHost
      ) : null}
    </>
  );
}
