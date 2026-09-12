import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronRight,
  CircleAlert,
  Gauge,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  X
} from "lucide-react";
import "./PlayerPropsPage.css";

const DEMO_PROPS = [
  { id: "allen-pass", player: "Josh Allen", team: "BUF", pos: "QB", matchup: "BUF @ NYJ", market: "Passing Yards", group: "Passing", line: "259.5", over: "-110", under: "-110" },
  { id: "allen-rush", player: "Josh Allen", team: "BUF", pos: "QB", matchup: "BUF @ NYJ", market: "Rushing Yards", group: "Rushing", line: "46.5", over: "-105", under: "-115" },
  { id: "lamar-td", player: "Lamar Jackson", team: "BAL", pos: "QB", matchup: "BAL @ CIN", market: "Passing TDs", group: "Passing", line: "1.5", over: "+105", under: "-125" },
  { id: "bijan-rush", player: "Bijan Robinson", team: "ATL", pos: "RB", matchup: "ATL @ PIT", market: "Rushing Yards", group: "Rushing", line: "74.5", over: "-110", under: "-110" },
  { id: "saquon-td", player: "Saquon Barkley", team: "PHI", pos: "RB", matchup: "DAL @ PHI", market: "Anytime TD", group: "Touchdowns", line: "Yes", over: "+105", under: "—" },
  { id: "ceedee-rec", player: "CeeDee Lamb", team: "DAL", pos: "WR", matchup: "DAL @ PHI", market: "Receiving Yards", group: "Receiving", line: "82.5", over: "-115", under: "-105" },
  { id: "jj-receptions", player: "Justin Jefferson", team: "MIN", pos: "WR", matchup: "GB @ MIN", market: "Receptions", group: "Receiving", line: "6.5", over: "-105", under: "-115" },
  { id: "chase-rec", player: "Ja'Marr Chase", team: "CIN", pos: "WR", matchup: "BAL @ CIN", market: "Receptions", group: "Receiving", line: "6.5", over: "-110", under: "-110" },
  { id: "kelce-rec", player: "Travis Kelce", team: "KC", pos: "TE", matchup: "DEN @ KC", market: "Receiving Yards", group: "Receiving", line: "58.5", over: "-110", under: "-110" }
];

const MARKET_FILTERS = ["All", "Passing", "Rushing", "Receiving", "Touchdowns"];
const POSITION_FILTERS = ["All", "QB", "RB", "WR", "TE"];

function StatusCard({ icon, label, value, tone = "neutral", note }) {
  return (
    <div className={`prop-status-card ${tone}`}>
      <span className="prop-status-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {note ? <span>{note}</span> : null}
      </div>
    </div>
  );
}

function PlayerCardModal({ prop, onClose }) {
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!prop) return null;

  return (
    <div className="player-card-backdrop" onMouseDown={onClose}>
      <section className="player-card-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="player-card-modal-head">
          <div className="player-card-brand">
            <img src="/banana-bets-logo.png" alt="" />
            <div>
              <strong>BANANA BETS</strong>
              <span>PLAYER RESEARCH</span>
            </div>
          </div>

          <div className="player-card-modal-title">
            <span>PLAYER CARD · UI PREVIEW</span>
            <h2>{prop.player}</h2>
          </div>

          <button className="player-card-close" onClick={onClose} aria-label="Close player card">
            <X size={22} />
          </button>
        </header>

        <div className="player-card-hero">
          <div className="player-card-avatar">
            <UserRound size={54} />
          </div>

          <div className="player-card-identity">
            <div className="player-card-badges">
              <span>{prop.pos}</span>
              <span>{prop.team}</span>
              <span>Sample UI</span>
            </div>
            <h3>{prop.player}</h3>
            <p>{prop.matchup}</p>
            <button className="player-watch-button"><Star size={15} /> Add to Watchlist</button>
          </div>

          <div className="player-card-current-line">
            <small>SELECTED SAMPLE MARKET</small>
            <strong>{prop.market}</strong>
            <div>
              <b>{prop.line}</b>
              <span>Over/Yes {prop.over}</span>
            </div>
          </div>

          <div className="player-card-confidence pending">
            <Gauge size={28} />
            <small>MODEL CONFIDENCE</small>
            <strong>Pending</strong>
            <span>Player ensemble not connected</span>
          </div>
        </div>

        <nav className="player-card-tabs">
          {["Overview", "Props", "Usage"].map((item) => (
            <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>

        {tab === "Overview" ? (
          <div className="player-card-modal-grid">
            <div className="player-card-main-column">
              <section className="player-card-panel">
                <div className="player-card-panel-head">
                  <div>
                    <small>PROP BOARD</small>
                    <h4>Markets for {prop.player}</h4>
                  </div>
                  <span className="sample-chip">SAMPLE LINES</span>
                </div>

                <div className="player-card-prop-row header">
                  <span>Market</span><span>Line</span><span>Over / Yes</span><span>Projection</span><span>Edge</span>
                </div>
                {DEMO_PROPS.filter((row) => row.player === prop.player).map((row) => (
                  <div className="player-card-prop-row" key={row.id}>
                    <strong>{row.market}</strong>
                    <span>{row.line}</span>
                    <span>{row.over}</span>
                    <span className="pending-value">Pending</span>
                    <span className="pending-value">Pending</span>
                  </div>
                ))}
              </section>

              <section className="player-card-panel">
                <div className="player-card-panel-head">
                  <div>
                    <small>PLAYER FEATURE PIPELINE</small>
                    <h4>Research fields ready for the live card</h4>
                  </div>
                </div>
                <div className="player-feature-grid">
                  <div><span>Carries / Targets</span><strong>Tracked</strong></div>
                  <div><span>Red-zone usage</span><strong>Tracked</strong></div>
                  <div><span>Inside-10 usage</span><strong>Tracked</strong></div>
                  <div><span>Inside-5 usage</span><strong>Tracked</strong></div>
                </div>
              </section>
            </div>

            <aside className="player-card-side-column">
              <section className="player-card-panel model-panel">
                <div className="model-panel-title"><Sparkles size={18} /> Banana Projection</div>
                <strong>Not connected yet</strong>
                <p>The current workbook has player research features, but the player ensemble/fair-price model is not ready. This card will not invent a probability.</p>
              </section>

              <section className="player-card-panel">
                <div className="player-card-panel-head compact">
                  <div><small>MATCHUP CONTEXT</small><h4>What will live here</h4></div>
                </div>
                <ul className="player-context-list">
                  <li><ShieldCheck size={16} /> Opponent position defense</li>
                  <li><Activity size={16} /> Recent usage and role</li>
                  <li><Target size={16} /> Red-zone opportunity</li>
                  <li><BarChart3 size={16} /> Game environment</li>
                </ul>
              </section>
            </aside>
          </div>
        ) : tab === "Props" ? (
          <div className="player-card-single-panel">
            <section className="player-card-panel">
              <div className="player-card-panel-head">
                <div><small>ALL PLAYER MARKETS</small><h4>Prop comparison workspace</h4></div>
                <span className="sample-chip">ROUGH DRAFT</span>
              </div>
              <p className="player-card-placeholder-copy">This tab is reserved for sportsbook-by-sportsbook lines, Banana projection, fair odds, Over/Under probability, EV and Add to Builder controls once the player output API is connected.</p>
            </section>
          </div>
        ) : (
          <div className="player-card-single-panel">
            <section className="player-card-panel">
              <div className="player-card-panel-head">
                <div><small>USAGE + OPPORTUNITY</small><h4>Player role dashboard</h4></div>
                <span className="sample-chip">ROUGH DRAFT</span>
              </div>
              <div className="player-feature-grid large">
                <div><span>Weekly volume</span><strong>API next</strong></div>
                <div><span>Red-zone share</span><strong>API next</strong></div>
                <div><span>Inside-10 share</span><strong>API next</strong></div>
                <div><span>Recent trend</span><strong>API next</strong></div>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

export default function PlayerPropsPage({ season, week }) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("All");
  const [position, setPosition] = useState("All");
  const [selectedProp, setSelectedProp] = useState(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return DEMO_PROPS.filter((row) => {
      const queryMatch = !needle || [row.player, row.team, row.matchup, row.market].join(" ").toLowerCase().includes(needle);
      const marketMatch = market === "All" || row.group === market;
      const positionMatch = position === "All" || row.pos === position;
      return queryMatch && marketMatch && positionMatch;
    });
  }, [query, market, position]);

  return (
    <section className="player-props-page">
      <div className="player-props-preview-banner">
        <CircleAlert size={16} />
        <strong>UI PREVIEW</strong>
        <span>Prop lines on this rough draft are sample content for layout testing. Banana player probabilities, projections and EV are not connected yet.</span>
      </div>

      <div className="player-props-hero">
        <div>
          <span className="player-props-kicker">PLAYER MARKETS · {season} · {week}</span>
          <h1>Player Props</h1>
          <p>Search players, compare markets, open an instant Player Card, and eventually move a researched prop straight into Bet Builder.</p>
        </div>

        <div className="player-props-hero-status">
          <span>PLAYER MODEL</span>
          <strong>Research foundation ready</strong>
          <small>Projection + fair-price ensemble is the next backend connection.</small>
        </div>
      </div>

      <div className="player-props-status-grid">
        <StatusCard icon={<UserRound size={20} />} label="PLAYER FEATURES" value="Available" tone="green" note="Usage and TD opportunity fields exist" />
        <StatusCard icon={<Trophy size={20} />} label="MARKET TYPES" value="6 designed" tone="blue" note="Pass, rush, receive, receptions, TDs + more" />
        <StatusCard icon={<Gauge size={20} />} label="MODEL PRICING" value="Pending" tone="yellow" note="No fake probabilities in the UI" />
        <StatusCard icon={<Plus size={20} />} label="BET BUILDER" value="Prepared" tone="neutral" note="Enable after player outputs are live" />
      </div>

      <section className="player-props-workspace">
        <div className="player-props-toolbar">
          <div className="player-props-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search player, team, matchup or market..." />
            {query ? <button onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button> : null}
          </div>

          <div className="player-props-filter-group">
            <small>Position</small>
            <div>
              {POSITION_FILTERS.map((item) => <button key={item} className={position === item ? "active" : ""} onClick={() => setPosition(item)}>{item}</button>)}
            </div>
          </div>

          <div className="player-props-filter-group market-filter">
            <small>Market</small>
            <div>
              {MARKET_FILTERS.map((item) => <button key={item} className={market === item ? "active" : ""} onClick={() => setMarket(item)}>{item}</button>)}
            </div>
          </div>
        </div>

        <div className="player-props-table-shell">
          <div className="player-props-table-head">
            <div><span>PROP BOARD</span><strong>{filtered.length} sample markets</strong></div>
            <div className="player-props-table-legend"><span className="dot yellow" /> Model columns intentionally pending</div>
          </div>

          <div className="player-props-grid-row header">
            <span>Player</span><span>Matchup</span><span>Market</span><span>Sample Line</span><span>Over / Yes</span><span>Projection</span><span>Edge</span><span />
          </div>

          {filtered.length ? filtered.map((row) => (
            <button className="player-props-grid-row data" key={row.id} onClick={() => setSelectedProp(row)}>
              <span className="player-cell"><b>{row.player}</b><small>{row.pos} · {row.team}</small></span>
              <span>{row.matchup}</span>
              <span><b>{row.market}</b><small>{row.group}</small></span>
              <span className="sample-line">{row.line}<small>UI sample</small></span>
              <span>{row.over}</span>
              <span className="model-pending">Pending</span>
              <span className="model-pending">Pending</span>
              <span className="open-card-link">Player Card <ChevronRight size={15} /></span>
            </button>
          )) : (
            <div className="player-props-empty">No sample props match those filters.</div>
          )}
        </div>
      </section>

      <section className="player-props-roadmap">
        <div>
          <span className="player-props-kicker">HOW THIS BECOMES LIVE</span>
          <h2>UI first. Model truth second.</h2>
          <p>The page is intentionally ready before the player ensemble is. When the Sheet exposes player projections, the sample cells can be replaced without moving the interface around.</p>
        </div>
        <div className="player-props-roadmap-steps">
          <div className="done"><span>1</span><strong>Page + Player Card</strong><small>Functional rough draft</small></div>
          <div><span>2</span><strong>Player output API</strong><small>Lines + research features</small></div>
          <div><span>3</span><strong>Player ensemble</strong><small>Projection + probability + fair odds</small></div>
          <div><span>4</span><strong>Bet Builder</strong><small>Validated props become legs</small></div>
        </div>
      </section>

      <PlayerCardModal prop={selectedProp} onClose={() => setSelectedProp(null)} />
    </section>
  );
}
