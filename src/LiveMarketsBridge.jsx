import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, LineChart, Target } from "lucide-react";
import { getBets, getExplanations } from "./api";
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
  const aliases = { fanduel: "FanDuel", draftkings: "DraftKings", betmgm: "BetMGM", pinnacle: "Pinnacle" };
  return aliases[value] || String(value).replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function readTopbarSelection() {
  const seasonSelect = document.querySelector(".topbar .selector select");
  const weekSelect = document.querySelector(".topbar .week-selector select");
  const season = Number(seasonSelect?.value || 2026);
  const weekMatch = String(weekSelect?.value || "Week 1").match(/\d+/);
  return { season, week: weekMatch ? Number(weekMatch[0]) : 1 };
}

function uniqueBest(rows) {
  const best = new Map();
  rows.forEach((row) => {
    const key = [row.market, row.game_id, row.team, row.line].join("|");
    const current = best.get(key);
    if (!current || Number(row.ev || -999) > Number(current.ev || -999)) best.set(key, row);
  });
  return [...best.values()].sort((a, b) => Number(b.ev || 0) - Number(a.ev || 0));
}

function spreadLabel(row) {
  const line = numberOrNull(row?.line);
  return row ? `${row.team} ${line !== null && line > 0 ? "+" : ""}${line ?? "—"}` : "—";
}

function totalLabel(row) {
  return row ? `${String(row.team || "").toUpperCase()} ${row.line ?? "—"}` : "—";
}

function ensureAfter(id, selector) {
  let host = document.getElementById(id);
  const target = document.querySelector(selector);
  if (!target?.parentNode) return null;
  if (!host) {
    host = document.createElement("div");
    host.id = id;
  }
  if (host.parentNode !== target.parentNode || host.previousSibling !== target) {
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
  }
  if (host.parentNode !== target.parentNode || host.nextSibling !== target) {
    target.parentNode.insertBefore(host, target);
  }
  return host;
}

function MiniMarketCard({ type, row, count }) {
  const spread = type === "spread";
  return (
    <div className={`live-market-card ${spread ? "spread" : "total"}`}>
      <div className="live-market-card-head">
        <span>{spread ? <BarChart3 size={17} /> : <LineChart size={17} />}</span>
        <div><small>{spread ? "BEST SPREAD" : "BEST TOTAL"}</small><strong>{spread ? spreadLabel(row) : totalLabel(row)}</strong></div>
        <em>{count} qualified</em>
      </div>
      {row ? (
        <>
          <div className="live-market-main"><strong>{americanOdds(row.american_odds)}</strong><span>{row.matchup} · {displayBook(row.sportsbook)}</span></div>
          <div className="live-market-stats">
            <div><span>{spread ? "COVER" : "MODEL"}</span><b>{pct(row.model_win_prob)}</b></div>
            <div><span>FAIR</span><b>{americanOdds(row.fair_odds)}</b></div>
            <div><span>EV</span><b className={Number(row.ev) >= 0 ? "green-value" : "red-value"}>{signedPct(row.ev)}</b></div>
            <div><span>CONF.</span><b>{String(row.confidence || "—").toUpperCase()}</b></div>
          </div>
        </>
      ) : <div className="live-market-empty">No live rows returned.</div>}
    </div>
  );
}

function DashboardMarkets({ spreadRows, totalRows, loading }) {
  const spreads = useMemo(() => uniqueBest(spreadRows), [spreadRows]);
  const totals = useMemo(() => uniqueBest(totalRows), [totalRows]);
  const bestSpread = spreads[0] || null;
  const bestTotal = totals[0] || null;
  const spreadQualified = spreads.filter((row) => row.meets_threshold === true || row.meets_threshold === 1 || row.meets_threshold === "1").length;
  const totalQualified = totals.filter((row) => row.meets_threshold === true || row.meets_threshold === 1 || row.meets_threshold === "1").length;

  return (
    <section className="panel live-markets-dashboard">
      <div className="live-markets-heading">
        <div><span className="panel-kicker">NEW LIVE MARKETS</span><h2>Spread + Total Command Center</h2><p>These probabilities, fair prices and EV values come from the workbook output — the website is only displaying them.</p></div>
        <span className="live-market-status">{loading ? "SYNCING" : "LIVE"}</span>
      </div>
      <div className="live-market-card-grid">
        <MiniMarketCard type="spread" row={bestSpread} count={spreadQualified} />
        <MiniMarketCard type="total" row={bestTotal} count={totalQualified} />
      </div>
      <div className="live-market-top-grid">
        <div>
          <strong>TOP SPREADS</strong>
          {spreads.slice(0, 3).map((row, index) => <div className="live-market-list-row" key={`${row.game_id}-${row.team}-${row.line}-${index}`}><span>{spreadLabel(row)} <small>{row.matchup}</small></span><b>{signedPct(row.ev)} EV</b></div>)}
        </div>
        <div>
          <strong>TOP TOTALS</strong>
          {totals.slice(0, 3).map((row, index) => <div className="live-market-list-row" key={`${row.game_id}-${row.team}-${row.line}-${index}`}><span>{totalLabel(row)} <small>{row.matchup}</small></span><b>{signedPct(row.ev)} EV</b></div>)}
        </div>
      </div>
    </section>
  );
}

function TotalExplanation({ row }) {
  if (!row) return null;
  return (
    <div className="matchup-total-explanation">
      <div><strong>{String(row.team || "TOTAL").toUpperCase()}</strong><span className={`confidence-badge ${String(row.confidence || "low").toLowerCase()}`}>{String(row.confidence || "—").toUpperCase()}</span></div>
      <p>Primary: <b>{row.primary_factor || "—"}</b> {numberOrNull(row.primary_factor_value) !== null ? Number(row.primary_factor_value).toFixed(2) : ""}</p>
      <p>Secondary: <b>{row.secondary_factor || "—"}</b> {numberOrNull(row.secondary_factor_value) !== null ? Number(row.secondary_factor_value).toFixed(2) : ""}</p>
    </div>
  );
}

function MatchupTotals({ rows, explanations, loading }) {
  const best = useMemo(() => uniqueBest(rows).slice(0, 4), [rows]);
  const uniqueExplanations = useMemo(() => {
    const seen = new Set();
    return explanations.filter((row) => {
      const key = `${row.team}-${row.primary_factor}-${row.secondary_factor}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 2);
  }, [explanations]);

  if (!loading && !best.length) return null;

  return (
    <section className="panel matchup-standard-panel matchup-total-market-panel">
      <div className="panel-header matchup-standard-header">
        <div><span className="panel-kicker">TOTAL MARKET</span><h2>Best Current Over / Under Prices</h2><p>Game-total probability, fair odds and EV are now live from 46_TOTAL_BETS → 61_OUTPUT_BETS.</p></div>
        <LineChart size={22} />
      </div>
      <div className="matchup-total-table">
        <div className="matchup-total-head"><span>Selection</span><span>Book</span><span>Odds</span><span>Model</span><span>Fair Odds</span><span>EV</span><span>Confidence</span></div>
        {loading ? <div className="matchup-total-loading">Loading total market…</div> : best.map((row, index) => (
          <div className="matchup-total-row" key={`${row.game_id}-${row.team}-${row.sportsbook}-${row.line}-${index}`}>
            <strong>{totalLabel(row)}</strong><span>{displayBook(row.sportsbook)}</span><strong>{americanOdds(row.american_odds)}</strong><strong>{pct(row.model_win_prob)}</strong><strong>{americanOdds(row.fair_odds)}</strong><strong className={Number(row.ev)>=0?"green-value":"red-value"}>{signedPct(row.ev)}</strong><span className={`confidence-badge ${String(row.confidence || "low").toLowerCase()}`}>{String(row.confidence || "—").toUpperCase()}</span>
          </div>
        ))}
      </div>
      {uniqueExplanations.length ? <div className="matchup-total-explanation-grid">{uniqueExplanations.map((row, index) => <TotalExplanation key={`${row.team}-${index}`} row={row} />)}</div> : null}
    </section>
  );
}

export default function LiveMarketsBridge() {
  const [{ season, week }, setSelection] = useState(() => readTopbarSelection());
  const [gameId, setGameId] = useState(() => sessionStorage.getItem("banana-bets:selected-matchup") || "");
  const [spreadRows, setSpreadRows] = useState([]);
  const [totalRows, setTotalRows] = useState([]);
  const [matchupTotalRows, setMatchupTotalRows] = useState([]);
  const [totalExplanations, setTotalExplanations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchupLoading, setMatchupLoading] = useState(false);
  const [dashboardHost, setDashboardHost] = useState(null);
  const [matchupHost, setMatchupHost] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = readTopbarSelection();
      setSelection((current) => current.season === next.season && current.week === next.week ? current : next);
      const nextGame = sessionStorage.getItem("banana-bets:selected-matchup") || "";
      setGameId((current) => current === nextGame ? current : nextGame);

      const dashboard = document.querySelector('.hero[data-tour="snapshot"]');
      if (dashboard) setDashboardHost(ensureAfter("banana-live-markets-dashboard", ".metrics"));
      else {
        document.getElementById("banana-live-markets-dashboard")?.remove();
        setDashboardHost(null);
      }

      const matchupStats = document.querySelector("#matchup-stats");
      if (matchupStats) setMatchupHost(ensureBefore("banana-matchup-totals-host", "#matchup-stats"));
      else {
        document.getElementById("banana-matchup-totals-host")?.remove();
        setMatchupHost(null);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([
      getBets({ season, week, market: "spread", limit: 500 }),
      getBets({ season, week, market: "total", limit: 500 })
    ]).then((results) => {
      if (cancelled) return;
      setSpreadRows(results[0].status === "fulfilled" ? results[0].value?.rows || [] : []);
      setTotalRows(results[1].status === "fulfilled" ? results[1].value?.rows || [] : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [season, week]);

  useEffect(() => {
    if (!gameId) {
      setMatchupTotalRows([]);
      setTotalExplanations([]);
      return undefined;
    }
    let cancelled = false;
    setMatchupLoading(true);
    Promise.allSettled([
      getBets({ gameId, market: "total", limit: 20 }),
      getExplanations({ gameId, market: "total", limit: 20 })
    ]).then((results) => {
      if (cancelled) return;
      setMatchupTotalRows(results[0].status === "fulfilled" ? results[0].value?.rows || [] : []);
      setTotalExplanations(results[1].status === "fulfilled" ? results[1].value?.rows || [] : []);
      setMatchupLoading(false);
    });
    return () => { cancelled = true; };
  }, [gameId]);

  return (
    <>
      {dashboardHost ? createPortal(<DashboardMarkets spreadRows={spreadRows} totalRows={totalRows} loading={loading} />, dashboardHost) : null}
      {matchupHost ? createPortal(<MatchupTotals rows={matchupTotalRows} explanations={totalExplanations} loading={matchupLoading} />, matchupHost) : null}
    </>
  );
}
