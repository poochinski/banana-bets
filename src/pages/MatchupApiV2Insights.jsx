import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, AlertTriangle, BarChart3, BrainCircuit, LineChart } from "lucide-react";
import {
  getBets,
  getExplanations,
  getGames,
  getModelBreakdown,
  getPerformance
} from "../api";
import "./MatchupApiV2Insights.css";

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pct(value, digits = 1) {
  const number = numberOrNull(value);
  return number === null ? "—" : `${(number * 100).toFixed(digits)}%`;
}

function signed(value, digits = 2) {
  const number = numberOrNull(value);
  if (number === null) return "—";
  return `${number >= 0 ? "+" : ""}${number.toFixed(digits)}`;
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
  const names = {
    fanduel: "FanDuel",
    draftkings: "DraftKings",
    betmgm: "BetMGM",
    pinnacle: "Pinnacle"
  };
  return names[value] || String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function factorLabel(value) {
  return String(value || "—").replaceAll("_", " ");
}

function StatCard({ label, value, note }) {
  return (
    <div className="v2-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function ExplanationCard({ row }) {
  if (!row) return null;

  return (
    <div className="v2-explanation-card">
      <div className="v2-explanation-head">
        <strong>{row.team} {String(row.market || "").toUpperCase()}</strong>
        <span className={`confidence-badge ${String(row.confidence || "low").toLowerCase()}`}>
          {String(row.confidence || "—").toUpperCase()}
        </span>
      </div>

      <div className="v2-factor-row">
        <span>#1 {factorLabel(row.primary_factor)}</span>
        <strong>{signed(row.primary_factor_value)}</strong>
      </div>
      <div className="v2-factor-row">
        <span>#2 {factorLabel(row.secondary_factor)}</span>
        <strong>{signed(row.secondary_factor_value)}</strong>
      </div>
      <div className="v2-market-agreement">
        Market agreement: <b>{factorLabel(row.market_agreement)}</b>
      </div>
    </div>
  );
}

function ensurePortalHost({ id, beforeSelector }) {
  let host = document.getElementById(id);
  if (host) return host;

  const before = document.querySelector(beforeSelector);
  const parent = before?.parentNode;
  if (!before || !parent) return null;

  host = document.createElement("div");
  host.id = id;
  host.className = "matchup-v2-integrated-host";
  parent.insertBefore(host, before);
  return host;
}

export default function MatchupApiV2Insights({ rows = [], season, week }) {
  const fallbackGameId = rows.find((row) => row?.game_id)?.game_id || "";
  const [gameId, setGameId] = useState(
    () => sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId
  );
  const [game, setGame] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [explanations, setExplanations] = useState([]);
  const [spreadRows, setSpreadRows] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [researchHost, setResearchHost] = useState(null);
  const [validationHost, setValidationHost] = useState(null);

  useEffect(() => {
    const mountPortals = () => {
      setResearchHost(
        ensurePortalHost({
          id: "matchup-v2-research-host",
          beforeSelector: "#matchup-stats"
        })
      );
      setValidationHost(
        ensurePortalHost({
          id: "matchup-v2-validation-host",
          beforeSelector: ".matchup-take-standard"
        })
      );
    };

    mountPortals();
    const timer = window.setTimeout(mountPortals, 100);

    return () => {
      window.clearTimeout(timer);
      document.getElementById("matchup-v2-research-host")?.remove();
      document.getElementById("matchup-v2-validation-host")?.remove();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId;
      setGameId((current) => (next && next !== current ? next : current));
    }, 300);

    return () => window.clearInterval(timer);
  }, [fallbackGameId]);

  useEffect(() => {
    if (!gameId) return undefined;

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.allSettled([
      getGames({ gameId, season, week, limit: 5 }),
      getModelBreakdown({ gameId, limit: 5 }),
      getExplanations({ gameId, limit: 20 }),
      getBets({ gameId, market: "spread", limit: 20 }),
      getPerformance({ latestOnly: true, limit: 5 })
    ]).then((results) => {
      if (cancelled) return;

      setGame(results[0].status === "fulfilled" ? results[0].value?.rows?.[0] || null : null);
      setBreakdown(results[1].status === "fulfilled" ? results[1].value?.rows?.[0] || null : null);
      setExplanations(results[2].status === "fulfilled" ? results[2].value?.rows || [] : []);
      setSpreadRows(results[3].status === "fulfilled" ? results[3].value?.rows || [] : []);
      setPerformance(results[4].status === "fulfilled" ? results[4].value?.rows?.[0] || null : null);

      if (results.every((result) => result.status === "rejected")) {
        setError("Banana API v2 data could not be loaded for this matchup.");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [gameId, season, week]);

  const bestSpreads = useMemo(() => {
    return [...spreadRows]
      .filter((row) => numberOrNull(row.ev) !== null)
      .sort((a, b) => Number(b.ev) - Number(a.ev))
      .slice(0, 4);
  }, [spreadRows]);

  const moneylineExplanations = useMemo(() => {
    return explanations.filter((row) => String(row.market || "").toLowerCase() === "moneyline");
  }, [explanations]);

  if (!gameId) return null;

  const researchContent = (
    <div className="matchup-v2-insights matchup-v2-inline">
      <div className="matchup-v2-flow-label">
        <div>
          <span className="panel-kicker">MODEL INTELLIGENCE</span>
          <strong>Why the numbers look the way they do</strong>
        </div>
        <span className="matchup-live-pill"><Activity size={13} /> {loading ? "SYNCING" : "LIVE"}</span>
      </div>

      {error ? <div className="v2-error"><AlertTriangle size={16} /> {error}</div> : null}

      {breakdown ? (
        <section className="panel matchup-standard-panel v2-panel">
          <div className="panel-header matchup-standard-header">
            <div>
              <span className="panel-kicker">MODEL DNA</span>
              <h2>How Banana got here</h2>
              <p>Raw fundamentals, calibration/shrinkage, sharp-market context, and final game-level output.</p>
            </div>
            <BrainCircuit size={22} />
          </div>

          <div className="v2-stat-grid">
            <StatCard label="RAW HOME PROBABILITY" value={pct(breakdown.raw_win_prob_home)} note="Before early-season shrinkage" />
            <StatCard label="FINAL HOME PROBABILITY" value={pct(breakdown.calibrated_win_prob_home)} note="Website-facing Banana probability" />
            <StatCard label="MARKET HOME PROBABILITY" value={pct(game?.market_win_prob_home)} note="Sharp-market context" />
            <StatCard label="FUNDAMENTALS WEIGHT" value={pct(breakdown.shrinkage_weight)} note={`${breakdown.games_used_min ?? "—"} current-season games used`} />
            <StatCard label="MODEL MARGIN" value={signed(game?.model_margin)} note="Home perspective" />
            <StatCard label="MARKET SPREAD" value={signed(game?.market_spread)} note="Consensus game line" />
          </div>

          <div className="v2-component-grid">
            <StatCard label="POWER" value={signed(breakdown.power_component)} />
            <StatCard label="ELO" value={signed(breakdown.elo_component)} />
            <StatCard label="RECENT FORM" value={signed(breakdown.recent_form_component)} />
            <StatCard label="MATCHUP" value={signed(breakdown.matchup_component)} />
            <StatCard label="MARKET MODEL" value={signed(breakdown.market_model_component)} />
          </div>

          {Number(breakdown.games_used_min) === 0 ? (
            <div className="v2-warning">
              <AlertTriangle size={16} />
              <div>
                <strong>Early-season sample warning</strong>
                <span>No current-season games are in the fundamentals sample yet. Banana is intentionally leaning more heavily on calibration and the sharp market.</span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {moneylineExplanations.length ? (
        <section className="panel matchup-standard-panel v2-panel">
          <div className="panel-header matchup-standard-header">
            <div>
              <span className="panel-kicker">WHY BANANA SEES IT THIS WAY</span>
              <h2>Model Explanations</h2>
              <p>Structured reasons generated by the workbook, not prose invented by the website.</p>
            </div>
            <BarChart3 size={22} />
          </div>
          <div className="v2-explanation-grid">
            {moneylineExplanations.slice(0, 2).map((row) => (
              <ExplanationCard key={`${row.game_id}-${row.team}-${row.market}`} row={row} />
            ))}
          </div>
        </section>
      ) : null}

      {bestSpreads.length ? (
        <section className="panel matchup-standard-panel v2-panel">
          <div className="panel-header matchup-standard-header">
            <div>
              <span className="panel-kicker">SPREAD MARKET</span>
              <h2>Best Current Spread Prices</h2>
              <p>Cover probability, fair price and EV come directly from the workbook. Blank spread market-probability/edge fields stay blank instead of being invented in React.</p>
            </div>
            <LineChart size={22} />
          </div>

          <div className="v2-spread-table">
            <div className="v2-spread-head">
              <span>Selection</span><span>Book</span><span>Odds</span><span>Cover Prob.</span><span>Fair Odds</span><span>EV</span><span>Confidence</span>
            </div>
            {bestSpreads.map((row, index) => (
              <div className="v2-spread-row" key={`${row.game_id}-${row.team}-${row.sportsbook}-${row.line}-${index}`}>
                <strong>{row.team} {Number(row.line) > 0 ? "+" : ""}{row.line}</strong>
                <span>{displayBook(row.sportsbook)}</span>
                <strong>{americanOdds(row.american_odds)}</strong>
                <strong>{pct(row.model_win_prob)}</strong>
                <strong>{americanOdds(row.fair_odds)}</strong>
                <strong className={Number(row.ev) >= 0 ? "green-value" : "red-value"}>{signedPct(row.ev)}</strong>
                <span className={`confidence-badge ${String(row.confidence || "low").toLowerCase()}`}>{String(row.confidence || "—").toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );

  const validationContent = performance ? (
    <section className="panel matchup-standard-panel v2-panel v2-performance-panel matchup-v2-validation-inline">
      <div className="panel-header matchup-standard-header">
        <div>
          <span className="panel-kicker">MODEL VALIDATION</span>
          <h2>How Banana has performed out of sample</h2>
          <p>Training {performance.train_seasons || "—"} · testing {performance.test_season || "—"} · calibration {String(performance.active_calibration_method || "—").toUpperCase()}.</p>
        </div>
      </div>
      <div className="v2-stat-grid v2-performance-grid">
        <StatCard label="TEST GAMES" value={performance.n_test ?? "—"} />
        <StatCard label="LOGISTIC ACCURACY" value={pct(performance.logistic_accuracy)} />
        <StatCard label="CALIBRATED ACCURACY" value={pct(performance.calibrated_accuracy)} />
        <StatCard label="BRIER SCORE" value={numberOrNull(performance.calibrated_brier)?.toFixed(4) || "—"} />
        <StatCard label="REGRESSION MAE" value={numberOrNull(performance.regression_mae)?.toFixed(2) || "—"} note="Points" />
        <StatCard label="REGRESSION RMSE" value={numberOrNull(performance.regression_rmse)?.toFixed(2) || "—"} note="Points" />
      </div>
    </section>
  ) : null;

  return (
    <>
      {researchHost ? createPortal(researchContent, researchHost) : null}
      {validationHost && validationContent ? createPortal(validationContent, validationHost) : null}
    </>
  );
}
