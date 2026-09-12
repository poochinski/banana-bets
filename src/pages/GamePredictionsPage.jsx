import React, { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CircleDollarSign, LineChart, Target } from "lucide-react";
import { getBets } from "../api";
import "./GamePredictionsPage.css";

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

function selectionLabel(row) {
  const market = String(row.market || "").toLowerCase();
  if (market === "moneyline") return `${row.team} ML`;
  if (market === "spread") {
    const line = numberOrNull(row.line);
    return `${row.team} ${line !== null && line > 0 ? "+" : ""}${line ?? "—"}`;
  }
  if (market === "total") return `${String(row.team || "").toUpperCase()} ${row.line ?? "—"}`;
  return row.team || "Selection";
}

function marketKey(row) {
  return [row.market, row.game_id, row.team, row.line].join("|");
}

function bestUniqueRows(rows) {
  const best = new Map();
  rows.forEach((row) => {
    const key = marketKey(row);
    const current = best.get(key);
    if (!current || Number(row.ev || -999) > Number(current.ev || -999)) best.set(key, row);
  });
  return [...best.values()].sort((a, b) => Number(b.ev || 0) - Number(a.ev || 0));
}

function readTopbarSelection() {
  const seasonSelect = document.querySelector(".topbar .selector select");
  const weekSelect = document.querySelector(".topbar .week-selector select");
  const season = Number(seasonSelect?.value || 2026);
  const weekMatch = String(weekSelect?.value || "Week 1").match(/\d+/);
  return { season, week: weekMatch ? Number(weekMatch[0]) : 1 };
}

function MarketCard({ title, row, icon }) {
  return (
    <article className="gp-market-card panel">
      <div className="gp-market-card-head">
        <span>{icon}</span>
        <div><small>{title}</small><strong>{row ? selectionLabel(row) : "No live row"}</strong></div>
      </div>
      {row ? (
        <>
          <div className="gp-market-price"><strong>{americanOdds(row.american_odds)}</strong><span>{displayBook(row.sportsbook)}</span></div>
          <div className="gp-market-kpis">
            <div><span>MODEL</span><strong>{pct(row.model_win_prob)}</strong></div>
            <div><span>FAIR</span><strong>{americanOdds(row.fair_odds)}</strong></div>
            <div><span>EV</span><strong className={Number(row.ev) >= 0 ? "green-value" : "red-value"}>{signedPct(row.ev)}</strong></div>
          </div>
          <div className="gp-market-meta">{row.matchup} · {String(row.confidence || "—").toUpperCase()} confidence</div>
        </>
      ) : <div className="gp-empty">No rows returned for this market.</div>}
    </article>
  );
}

export default function GamePredictionsPage() {
  const [{ season, week }, setSelection] = useState(() => readTopbarSelection());
  const [market, setMarket] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = readTopbarSelection();
      setSelection((current) => current.season === next.season && current.week === next.week ? current : next);
    }, 300);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.allSettled([
      getBets({ season, week, market: "moneyline", limit: 500 }),
      getBets({ season, week, market: "spread", limit: 500 }),
      getBets({ season, week, market: "total", limit: 500 })
    ]).then((results) => {
      if (cancelled) return;
      const combined = results.flatMap((result) => result.status === "fulfilled" && Array.isArray(result.value?.rows) ? result.value.rows : []);
      setRows(combined);
      if (results.every((result) => result.status === "rejected")) setError("Live game markets could not be loaded from the Banana API.");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [season, week]);

  const uniqueRows = useMemo(() => bestUniqueRows(rows), [rows]);
  const filtered = useMemo(() => market === "all" ? uniqueRows : uniqueRows.filter((row) => String(row.market).toLowerCase() === market), [uniqueRows, market]);
  const topMoneyline = uniqueRows.find((row) => row.market === "moneyline") || null;
  const topSpread = uniqueRows.find((row) => row.market === "spread") || null;
  const topTotal = uniqueRows.find((row) => row.market === "total") || null;

  return (
    <section className="game-predictions-page">
      <div className="gp-hero">
        <div><span className="product-page-eyebrow">LIVE GAME MARKETS</span><h1>Game Predictions</h1><p>Moneyline, spread and game-total output directly from Banana's website-safe betting feed.</p></div>
        <div className="gp-live"><Activity size={14} /> {loading ? "SYNCING" : "LIVE"} · {season} WEEK {week}</div>
      </div>

      {error ? <div className="gp-error">{error}</div> : null}

      <div className="gp-market-leaders">
        <MarketCard title="BEST MONEYLINE" row={topMoneyline} icon={<CircleDollarSign size={19} />} />
        <MarketCard title="BEST SPREAD" row={topSpread} icon={<BarChart3 size={19} />} />
        <MarketCard title="BEST TOTAL" row={topTotal} icon={<LineChart size={19} />} />
      </div>

      <section className="panel gp-board">
        <div className="gp-board-head">
          <div><span className="panel-kicker">61_OUTPUT_BETS</span><h2>Live Market Board</h2></div>
          <div className="gp-tabs">
            {[['all','All'],['moneyline','Moneyline'],['spread','Spread'],['total','Totals']].map(([value,label]) => <button key={value} className={market===value?'active':''} onClick={() => setMarket(value)}>{label}</button>)}
          </div>
        </div>
        <div className="gp-table-wrap">
          <div className="gp-table-head"><span>Selection</span><span>Matchup</span><span>Book</span><span>Odds</span><span>Model</span><span>Fair</span><span>EV</span><span>Conf.</span></div>
          {loading ? <div className="gp-loading">Loading Banana game markets…</div> : filtered.slice(0, 40).map((row, index) => (
            <div className={`gp-table-row ${row.meets_threshold ? 'threshold' : ''}`} key={`${marketKey(row)}-${row.sportsbook}-${index}`}>
              <strong>{selectionLabel(row)}</strong><span>{row.matchup}</span><span>{displayBook(row.sportsbook)}</span><strong>{americanOdds(row.american_odds)}</strong><strong>{pct(row.model_win_prob)}</strong><strong>{americanOdds(row.fair_odds)}</strong><strong className={Number(row.ev)>=0?'green-value':'red-value'}>{signedPct(row.ev)}</strong><span className={`confidence-badge ${String(row.confidence || 'low').toLowerCase()}`}>{String(row.confidence || '—').toUpperCase()}</span>
            </div>
          ))}
        </div>
        {!loading && filtered.length === 0 ? <div className="gp-empty"><Target size={17} /> No rows returned for this market.</div> : null}
      </section>
    </section>
  );
}
