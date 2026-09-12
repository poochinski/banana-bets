import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Filter,
  LayoutGrid,
  LineChart,
  List,
  Plus,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { marketRowToLeg } from "../hooks/useBetBuilder";

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function numberValue(value) {
  const number = numberOrNull(value);
  return number === null ? 0 : number;
}

function percent(value, digits = 1) {
  const number = numberOrNull(value);
  return number === null ? "—" : `${(number * 100).toFixed(digits)}%`;
}

function signedPercent(value, digits = 1) {
  const number = numberOrNull(value);
  if (number === null) return "—";
  return `${number >= 0 ? "+" : ""}${(number * 100).toFixed(digits)}%`;
}

function signedPoints(value, digits = 1) {
  const number = numberOrNull(value);
  if (number === null) return "—";
  return `${number >= 0 ? "+" : ""}${(number * 100).toFixed(digits)} pp`;
}

function americanOdds(value) {
  const number = numberOrNull(value);
  if (number === null) return "—";
  const rounded = Math.round(number);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function displayBook(value) {
  if (!value) return "Unknown book";
  const aliases = {
    williamhill: "William Hill",
    fanduel: "FanDuel",
    draftkings: "DraftKings",
    betmgm: "BetMGM",
    pinnacle: "Pinnacle"
  };
  return aliases[value] || String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

function selectionLabel(row, market) {
  if (!row) return "—";
  const side = marketSide(row);
  const line = marketLine(row);

  if (market === "spread") {
    return `${side || "TEAM"} ${line !== null && line > 0 ? "+" : ""}${line ?? "—"}`;
  }

  return `${side || "TOTAL"} ${line ?? "—"}`;
}

function valueLabel(row) {
  const ev = numberValue(row.ev);
  if (ev > 0) return { label: "POSITIVE EV", tone: "positive", icon: TrendingUp };
  if (ev < 0) return { label: "NEGATIVE EV", tone: "negative", icon: TrendingDown };
  return { label: "NEAR FAIR", tone: "neutral", icon: BarChart3 };
}

function explanation(row, market) {
  const selection = selectionLabel(row, market);
  const model = percent(row.model_win_prob ?? row.model_prob ?? row.cover_probability);
  const fair = americanOdds(row.fair_odds);
  const ev = signedPercent(row.ev);

  if (market === "spread") {
    return `${selection} has a ${model} Banana cover probability. Banana's fair price is ${fair}; the listed sportsbook price produces ${ev} EV.`;
  }

  return `${selection} has a ${model} Banana probability. Banana's fair price is ${fair}; the listed sportsbook price produces ${ev} EV.`;
}

function ProbabilityBars({ row, market }) {
  const modelRaw = numberOrNull(row.model_win_prob ?? row.model_prob ?? row.cover_probability);
  const marketRaw = numberOrNull(row.market_win_prob ?? row.market_prob);
  const model = Math.max(0, Math.min(100, (modelRaw ?? 0) * 100));
  const marketValue = marketRaw === null ? null : Math.max(0, Math.min(100, marketRaw * 100));

  return (
    <div className="value-probability-bars">
      <div>
        <span>
          <strong>{market === "spread" ? "Banana cover" : "Banana"}</strong>
          <b>{modelRaw === null ? "—" : `${model.toFixed(1)}%`}</b>
        </span>
        <div className="probability-track">
          <div className="probability-fill model-fill" style={{ width: `${model}%` }} />
        </div>
      </div>

      {marketValue !== null ? (
        <div>
          <span><strong>Market</strong><b>{marketValue.toFixed(1)}%</b></span>
          <div className="probability-track">
            <div className="probability-fill market-fill" style={{ width: `${marketValue}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ValueCard({ row, market, onViewMatchup, onAddToBuilder, isInBuilder }) {
  const value = valueLabel(row);
  const Icon = value.icon;
  const edge = numberOrNull(row.edge_vs_market);

  return (
    <article className={`moneyline-value-card ${value.tone}`}>
      <div className="moneyline-value-card-top">
        <div>
          <span className={`value-status ${value.tone}`}><Icon size={13} />{value.label}</span>
          <h3>
            {selectionLabel(row, market)}{" "}
            <strong>{americanOdds(row.american_odds)}</strong>
          </h3>
          <p>{row.matchup}</p>
        </div>
        <div className="value-book"><span>LISTED BOOK</span><strong>{displayBook(row.sportsbook)}</strong></div>
      </div>

      <ProbabilityBars row={row} market={market} />

      <div className="value-card-metrics">
        <div><span>Model edge</span><strong className="green-value">{edge === null ? "—" : signedPoints(edge)}</strong></div>
        <div><span>Expected value</span><strong className={numberValue(row.ev) >= 0 ? "green-value" : "red-value"}>{signedPercent(row.ev)}</strong></div>
        <div><span>Banana fair odds</span><strong>{americanOdds(row.fair_odds)}</strong></div>
        <div><span>Confidence</span><strong>{String(row.confidence || "—").toUpperCase()}</strong></div>
      </div>

      <div className="value-card-explanation"><span>WHY IT MATTERS</span><p>{explanation(row, market)}</p></div>

      <div className="value-card-actions">
        <button type="button" className={`value-builder-button ${isInBuilder ? "added" : ""}`} onClick={() => onAddToBuilder(row)}>
          <Plus size={14} />{isInBuilder ? "Added" : "Add to Builder"}
        </button>
        <button type="button" className="value-matchup-button" onClick={() => onViewMatchup(row)}>
          Research matchup <ArrowRight size={15} />
        </button>
      </div>
    </article>
  );
}

function AdvancedTable({ rows, market }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Matchup</th><th>Selection</th><th>Book</th><th>Odds</th><th>Model Fair Odds</th><th>{market === "spread" ? "Cover Prob." : "Model Prob."}</th><th>Market</th><th>Edge (PP)</th><th>EV</th><th>Conf.</th></tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.game_id}-${marketSide(row)}-${marketLine(row)}-${row.sportsbook}-${index}`} className={row.meets_threshold ? "threshold-row" : ""}>
              <td><strong>{row.matchup}</strong></td>
              <td><span className="team-badge">{selectionLabel(row, market)}</span></td>
              <td className="book-cell">{displayBook(row.sportsbook)}</td>
              <td className="odds-cell">{americanOdds(row.american_odds)}</td>
              <td>{americanOdds(row.fair_odds)}</td>
              <td><span className="probability-pill">{percent(row.model_win_prob ?? row.model_prob ?? row.cover_probability)}</span></td>
              <td>{percent(row.market_win_prob ?? row.market_prob)}</td>
              <td><span className={numberValue(row.edge_vs_market) >= 0 ? "edge-positive" : "edge-negative"}>{numberOrNull(row.edge_vs_market) === null ? "—" : signedPoints(row.edge_vs_market)}</span></td>
              <td><span className={numberValue(row.ev) >= 0 ? "ev-positive" : "ev-negative"}>{signedPercent(row.ev)}</span></td>
              <td><span className={`confidence-badge ${String(row.confidence || "low").toLowerCase()}`}>{String(row.confidence || "—").toUpperCase()}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GameMarketValueFinder({ market, rows = [], loading = false, error = "", builderLegIds }) {
  const [view, setView] = useState("simple");
  const [sort, setSort] = useState("ev");
  const [confidence, setConfidence] = useState("all");
  const [book, setBook] = useState("all");
  const [minEv, setMinEv] = useState("all");
  const [side, setSide] = useState("all");

  const title = market === "spread" ? "Spread Value Finder" : "Over / Under Value Finder";
  const kicker = market === "spread" ? "POINT SPREAD VALUE FINDER" : "GAME TOTAL VALUE FINDER";
  const Icon = market === "spread" ? BarChart3 : LineChart;

  const books = useMemo(() => Array.from(new Set(rows.map((row) => row.sportsbook).filter(Boolean))).sort(), [rows]);
  const filteredRows = useMemo(() => {
    let next = [...rows];
    if (confidence !== "all") next = next.filter((row) => String(row.confidence || "").toLowerCase() === confidence);
    if (book !== "all") next = next.filter((row) => row.sportsbook === book);
    if (minEv !== "all") next = next.filter((row) => numberValue(row.ev) >= Number(minEv) / 100);
    if (side !== "all") {
      if (market === "total") next = next.filter((row) => marketSide(row).toLowerCase() === side);
      else next = next.filter((row) => side === "underdog" ? (marketLine(row) ?? 0) > 0 : (marketLine(row) ?? 0) < 0);
    }
    next.sort((a, b) => {
      if (sort === "probability") return numberValue(b.model_win_prob ?? b.model_prob) - numberValue(a.model_win_prob ?? a.model_prob);
      if (sort === "odds") return numberValue(b.american_odds) - numberValue(a.american_odds);
      return numberValue(b.ev) - numberValue(a.ev);
    });
    return next;
  }, [rows, market, confidence, book, minEv, side, sort]);

  function viewMatchup(row) {
    sessionStorage.setItem("banana-bets:selected-matchup", row.game_id || row.matchup || "");
    window.history.pushState({}, "", "/matchups");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function addToBuilder(row) {
    const leg = marketRowToLeg(row, market);
    window.dispatchEvent(new CustomEvent("banana-bets:add-builder-leg", { detail: leg }));
  }

  return (
    <section className="panel moneyline-finder-v2 game-market-finder-v2" data-market={market}>
      <div className="moneyline-finder-heading">
        <div>
          <span className="panel-kicker">{kicker}</span>
          <h2>{title}</h2>
          <p>{market === "spread" ? "The same Banana value workflow as moneyline, now using model cover probability, fair price, EV and confidence." : "The same Banana value workflow as moneyline, now using modeled Over / Under probability, fair price, EV and confidence."}</p>
        </div>
        <div className="finder-view-toggle">
          <button type="button" className={view === "simple" ? "active" : ""} onClick={() => setView("simple")}><LayoutGrid size={15} />Simple View</button>
          <button type="button" className={view === "advanced" ? "active" : ""} onClick={() => setView("advanced")}><List size={15} />Advanced Table</button>
        </div>
      </div>

      <div className="finder-how-to-read">
        <div><Icon size={18} /><span><strong>1. Read the selection.</strong>{market === "spread" ? " Team and point spread." : " Over or Under and the game total."}</span></div>
        <div><BookOpen size={18} /><span><strong>2. Check Banana probability.</strong> Fair odds translate that probability into a price.</span></div>
        <div><TrendingUp size={18} /><span><strong>3. Check EV.</strong> Positive EV means the listed price is favorable under Banana's estimate.</span></div>
      </div>

      {error ? <div className="finder-confidence-warning"><strong>API note:</strong> {error}</div> : null}

      <div className="finder-controls">
        <div className="finder-controls-title"><SlidersHorizontal size={16} />Filter & sort</div>
        <label><span>Sort by</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="ev">Highest EV</option><option value="probability">Highest model probability</option><option value="odds">Biggest price</option></select></label>
        <label><span>{market === "total" ? "Side" : "Spread type"}</span><select value={side} onChange={(e) => setSide(e.target.value)}><option value="all">All</option>{market === "total" ? <><option value="over">Overs</option><option value="under">Unders</option></> : <><option value="underdog">Plus points</option><option value="favorite">Minus points</option></>}</select></label>
        <label><span>Confidence</span><select value={confidence} onChange={(e) => setConfidence(e.target.value)}><option value="all">All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        <label><span>Sportsbook</span><select value={book} onChange={(e) => setBook(e.target.value)}><option value="all">All books</option>{books.map((bookKey) => <option key={bookKey} value={bookKey}>{displayBook(bookKey)}</option>)}</select></label>
        <label><span>Minimum EV</span><select value={minEv} onChange={(e) => setMinEv(e.target.value)}><option value="all">Any</option><option value="0">Positive only</option><option value="3">3%+</option><option value="5">5%+</option><option value="10">10%+</option></select></label>
      </div>

      <div className="finder-result-count"><Filter size={14} />{filteredRows.length} of {rows.length} selections shown</div>

      {loading ? <div className="loading-cell">Loading real Banana Bets model data...</div> : filteredRows.length === 0 ? <div className="finder-empty">No {market === "spread" ? "spread" : "Over / Under"} rows were returned for this week.</div> : view === "simple" ? (
        <div className="moneyline-value-grid">
          {filteredRows.map((row, index) => {
            const leg = marketRowToLeg(row, market);
            return <ValueCard key={`${row.game_id}-${marketSide(row)}-${marketLine(row)}-${row.sportsbook}-${index}`} row={row} market={market} onViewMatchup={viewMatchup} onAddToBuilder={addToBuilder} isInBuilder={builderLegIds?.has(leg.id)} />;
          })}
        </div>
      ) : <AdvancedTable rows={filteredRows} market={market} />}
    </section>
  );
}
