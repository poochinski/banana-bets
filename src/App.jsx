import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  CircleDollarSign,
  Database,
  Gamepad2,
  Home,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { demoDashboard } from "./data.js";
import { getDashboard } from "./api.js";

const NAV = [
  { label: "Dashboard", icon: Home },
  { label: "Games", icon: Gamepad2 },
  { label: "Bet Finder", icon: Target },
  { label: "Bet Analyzer", icon: SlidersHorizontal },
  { label: "Moneylines", icon: CircleDollarSign },
  { label: "Spreads & Totals", icon: BarChart3 },
  { label: "Player Props", icon: Users, badge: "Later" },
  { label: "Model Lab", icon: BrainCircuit },
  { label: "Performance", icon: TrendingUp },
  { label: "My Bets", icon: WalletCards },
  { label: "Settings", icon: Settings }
];

function BananaLogo({ compact = false }) {
  return (
    <div className={`banana-brand ${compact ? "compact" : ""}`}>
      <div className="banana-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <path d="M14 19c4 18 16 29 31 28 5 0 9-2 12-5-3 10-12 16-24 16C18 58 8 47 7 31c0-6 2-11 7-12Z" />
          <path className="banana-tip" d="M13 18c2-4 5-7 9-8 1 3 1 6-1 9-3-1-5-1-8-1Z" />
          <path className="banana-line" d="M18 23c5 12 14 19 27 19" />
        </svg>
      </div>
      {!compact && (
        <div>
          <div className="brand-name">BANANA <span>BETS</span></div>
          <div className="brand-sub">NFL MODEL + BETTING ANALYTICS</div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ page, setPage, open, setOpen }) {
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top-row">
          <BananaLogo />
          <button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-tagline">Peel back the numbers.</div>
        <nav className="nav-list">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = page === item.label;
            return (
              <button
                key={item.label}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => {
                  setPage(item.label);
                  setOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && <small>{item.badge}</small>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-status">
          <span className="status-dot" />
          <div>
            <strong>Model Engine</strong>
            <small>Ready for Sheets connection</small>
          </div>
        </div>
      </aside>
      {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    </>
  );
}

function Topbar({ season, setSeason, week, setWeek, setOpen, source }) {
  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="mobile-logo"><BananaLogo compact /></div>
      <SelectBox label="Season" value={season} onChange={setSeason} options={["2026", "2025", "2024"]} />
      <SelectBox label="Week" value={week} onChange={setWeek} options={Array.from({ length: 18 }, (_, i) => `Week ${i + 1}`)} week />
      <div className="data-source-pill">
        <span className={source === "live" ? "live-dot" : "demo-dot"} />
        {source === "live" ? "Live model data" : "Demo data"}
      </div>
      <div className="search-box">
        <Search size={17} />
        <input placeholder="Search team, game, player..." />
      </div>
      <button className="profile"><User size={19} /></button>
    </header>
  );
}

function SelectBox({ label, value, onChange, options, week = false }) {
  return (
    <label className={`select-block ${week ? "week-select" : ""}`}>
      <span>{label}</span>
      <div className="select-shell">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown size={14} />
      </div>
    </label>
  );
}

function Hero({ data }) {
  return (
    <section className="hero-card">
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={14} /> THIS WEEK'S MODEL</div>
        <h1>Find the <span>edge.</span><br />Skip the noise.</h1>
        <p>Power ratings, Elo, matchup data, simulation, market prices and EV — brought together in one weekly betting dashboard.</p>
        <div className="hero-actions">
          <button className="primary-button">View Best Bets</button>
          <button className="ghost-button">Explore Games</button>
        </div>
      </div>
      <div className="hero-stat">
        <div className="peel-ring">
          <div>
            <strong>{data.games.length}</strong>
            <span>Games</span>
          </div>
        </div>
        <p>Current slate loaded</p>
      </div>
    </section>
  );
}

function MetricCards({ data }) {
  const cards = [
    { label: "ROI", value: data.metrics.roi, icon: TrendingUp, tone: "green" },
    { label: "Win Rate", value: data.metrics.winRate, icon: Target },
    { label: "Games Analyzed", value: data.metrics.gamesAnalyzed, icon: Database },
    { label: "Last 10 Picks", value: data.metrics.recentRecord, icon: Trophy, tone: "yellow" }
  ];
  return (
    <section className="metric-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className="metric-card" key={card.label}>
            <div className={`metric-icon ${card.tone || ""}`}><Icon size={22} /></div>
            <div><span>{card.label}</span><strong>{card.value}</strong></div>
          </article>
        );
      })}
    </section>
  );
}

function GamesTable({ games }) {
  return (
    <section className="panel games-panel">
      <div className="panel-header">
        <div><span className="section-kicker">WEEKLY BOARD</span><h2>Game Predictions</h2></div>
        <button className="text-button">View all →</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Matchup</th><th>Market</th><th>Model</th><th>Win Prob</th><th>Edge</th><th>EV</th><th>Confidence</th><th>Signal</th></tr></thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td>
                  <div className="game-cell">
                    <div className="team-pair"><TeamChip team={game.away} /><span>@</span><TeamChip team={game.home} /></div>
                    <small>{game.date}</small>
                  </div>
                </td>
                <td><strong>{game.marketSpread}</strong><small>{game.total} total</small></td>
                <td><strong>{game.modelSpread}</strong><small>{game.moneyline}</small></td>
                <td><Probability value={game.winProb} /></td>
                <td className="positive">+{game.edge.toFixed(1)}%</td>
                <td className={game.ev >= 3 ? "positive" : "muted-number"}>+{game.ev.toFixed(1)}%</td>
                <td><Confidence value={game.confidence} /></td>
                <td><Signal value={game.pick} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TeamChip({ team }) {
  return <span className="team-chip">{team}</span>;
}

function Probability({ value }) {
  return (
    <div className="probability-cell">
      <strong>{value}%</strong>
      <div className="mini-track"><span style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function Confidence({ value }) {
  const cls = value >= 75 ? "high" : value >= 60 ? "medium" : "low";
  return <span className={`confidence ${cls}`}>{value}</span>;
}

function Signal({ value }) {
  const normalized = value.toLowerCase();
  const cls = normalized === "pass" ? "pass" : normalized === "watch" ? "watch" : "bet";
  return <span className={`signal ${cls}`}>{value}</span>;
}

function BestEdges({ games }) {
  const top = [...games].sort((a, b) => b.edge - a.edge).slice(0, 4);
  return (
    <section className="panel">
      <div className="panel-header"><div><span className="section-kicker">QUICK VIEW</span><h2>Best Edges</h2></div></div>
      <div className="edge-list">
        {top.map((game, index) => (
          <div className="edge-row" key={game.id}>
            <span className="rank">{index + 1}</span>
            <div><strong>{game.away} @ {game.home}</strong><small>{game.pick}</small></div>
            <strong className="positive">+{game.edge.toFixed(1)}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Angles({ angles }) {
  return (
    <section className="panel">
      <div className="panel-header"><div><span className="section-kicker">HISTORICAL</span><h2>Angles</h2></div></div>
      <div className="angle-list">
        {angles.map((angle) => (
          <div className="angle-row" key={angle.label}>
            <div><strong>{angle.label}</strong><small>{angle.detail}</small></div>
            <span>{angle.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModelMix({ components }) {
  return (
    <section className="panel">
      <div className="panel-header"><div><span className="section-kicker">ENGINE</span><h2>Model Mix</h2></div><Activity size={19} /></div>
      <div className="mix-list">
        {components.map((item) => (
          <div className="mix-row" key={item.label}>
            <div><span>{item.label}</span><strong>{item.value}%</strong></div>
            <div className="mix-track"><span style={{ width: `${item.value * 3.4}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="panel-note">These are demo weights for the website layout. Your validated model weights will come from the workbook.</p>
    </section>
  );
}

function Placeholder({ page }) {
  return (
    <section className="placeholder panel">
      <div className="placeholder-icon"><BrainCircuit size={40} /></div>
      <h1>{page}</h1>
      <p>The navigation and page shell are ready. This section will be connected to the matching Banana Bets output table when we build that module.</p>
    </section>
  );
}

function Dashboard({ data }) {
  return (
    <>
      <Hero data={data} />
      <MetricCards data={data} />
      <div className="dashboard-grid">
        <GamesTable games={data.games} />
        <div className="right-rail"><BestEdges games={data.games} /><Angles angles={data.angles} /></div>
      </div>
      <div className="bottom-grid">
        <ModelMix components={data.modelComponents} />
        <section className="panel connection-panel">
          <div><span className="section-kicker">NEXT CONNECTION</span><h2>Google Sheets → Banana Bets</h2></div>
          <p>The app already has a separate API adapter. Once we expose clean output tables from Sheets, we only replace demo data — the design does not have to change.</p>
          <div className="connection-flow"><span>Google Sheets</span><b>→</b><span>Apps Script / API</span><b>→</b><span>Banana Bets</span></div>
        </section>
      </div>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [season, setSeason] = useState("2026");
  const [week, setWeek] = useState("Week 1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [data, setData] = useState(demoDashboard);
  const [source, setSource] = useState("demo");

  const numericWeek = useMemo(() => Number(week.replace("Week ", "")), [week]);

  useEffect(() => {
    let cancelled = false;
    getDashboard(Number(season), numericWeek)
      .then((liveData) => {
        if (!cancelled && liveData) {
          setData(liveData);
          setSource("live");
        } else if (!cancelled) {
          setData(demoDashboard);
          setSource("demo");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(demoDashboard);
          setSource("demo");
        }
      });
    return () => { cancelled = true; };
  }, [season, numericWeek]);

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} open={mobileOpen} setOpen={setMobileOpen} />
      <div className="page-shell">
        <Topbar season={season} setSeason={setSeason} week={week} setWeek={setWeek} setOpen={setMobileOpen} source={source} />
        <main className="content">{page === "Dashboard" ? <Dashboard data={data} /> : <Placeholder page={page} />}</main>
        <footer><BananaLogo compact /><span>Banana Bets • Model-driven NFL betting analytics</span><span className="footer-disclaimer">For informational use. Bet responsibly.</span></footer>
      </div>
    </div>
  );
}
