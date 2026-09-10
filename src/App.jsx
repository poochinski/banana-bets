import React, { useMemo, useState } from "react";

import {
  Home,
  Gamepad2,
  SlidersHorizontal,
  Trophy,
  Users,
  BarChart3,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  Settings,
  Search,
  User,
  Menu,
  ChevronDown,
  Database,
  Target,
  CircleDollarSign,
  Activity,
  X
} from "lucide-react";

/* =========================================================
   NAVIGATION
   ========================================================= */

const NAV_ITEMS = [
  { name: "Dashboard", icon: Home },
  { name: "Game Predictions", icon: Gamepad2 },
  { name: "Spreads & Totals", icon: SlidersHorizontal },
  { name: "Moneylines", icon: CircleDollarSign },
  { name: "Player Props", icon: Users, badge: "Soon" },
  { name: "Team Analytics", icon: BarChart3 },
  { name: "Model Insights", icon: BrainCircuit },
  { name: "Trends & Angles", icon: TrendingUp },
  { name: "My Bets / Tracking", icon: ShieldCheck },
  { name: "Settings", icon: Settings }
];

/* =========================================================
   SAMPLE DATA

   IMPORTANT:
   This is temporary presentation data only.

   Eventually these values will come from the Banana Bets
   Google Sheets / Apps Script API.

   Do not treat these as live betting recommendations.
   ========================================================= */

const GAMES = [
  {
    date: "Thu 9/10",
    away: "SF",
    home: "LA",
    spread: "LA -1.5",
    total: "46.0",
    awayML: "+110",
    homeML: "-130",
    probability: 56,
    edge: 2.1,
    pick: "PASS",
    confidence: "low"
  },
  {
    date: "Sun 9/13",
    away: "MIA",
    home: "LV",
    spread: "LV -2.5",
    total: "44.0",
    awayML: "+150",
    homeML: "-170",
    probability: 61,
    edge: 8.4,
    pick: "MIA ML",
    confidence: "medium"
  },
  {
    date: "Sun 9/13",
    away: "BAL",
    home: "IND",
    spread: "BAL -3.0",
    total: "45.5",
    awayML: "-160",
    homeML: "+135",
    probability: 63,
    edge: 5.7,
    pick: "BAL -3.0",
    confidence: "medium"
  },
  {
    date: "Sun 9/13",
    away: "CHI",
    home: "CAR",
    spread: "CHI -2.5",
    total: "42.5",
    awayML: "-140",
    homeML: "+120",
    probability: 59,
    edge: 4.1,
    pick: "CHI ML",
    confidence: "medium"
  },
  {
    date: "Sun 9/13",
    away: "BUF",
    home: "HOU",
    spread: "BUF -3.5",
    total: "47.0",
    awayML: "-185",
    homeML: "+160",
    probability: 67,
    edge: 6.9,
    pick: "BUF -3.5",
    confidence: "high"
  },
  {
    date: "Sun 9/13",
    away: "TB",
    home: "CIN",
    spread: "CIN -1.0",
    total: "46.5",
    awayML: "+105",
    homeML: "-125",
    probability: 54,
    edge: 1.8,
    pick: "PASS",
    confidence: "low"
  },
  {
    date: "Sun 9/13",
    away: "GB",
    home: "MIN",
    spread: "GB -2.0",
    total: "45.0",
    awayML: "-130",
    homeML: "+110",
    probability: 60,
    edge: 4.9,
    pick: "GB ML",
    confidence: "medium"
  },
  {
    date: "Mon 9/14",
    away: "DEN",
    home: "KC",
    spread: "KC -4.5",
    total: "48.5",
    awayML: "+180",
    homeML: "-215",
    probability: 69,
    edge: 7.2,
    pick: "KC -4.5",
    confidence: "high"
  }
];

const ANGLES = [
  ["Home favorites", "62%"],
  ["Divisional unders", "64%"],
  ["Short-rest fade", "67%"],
  ["High-volume RB overs", "69%"],
  ["Elite QB vs weak pass D", "71%"]
];

const PROBABILITIES = [
  ["KC", 69],
  ["BUF", 67],
  ["BAL", 63],
  ["MIA", 61],
  ["GB", 60]
];

const COMPONENTS = [
  ["Power Rating", 25, "blue"],
  ["Recent Form", 20, "green"],
  ["Elo", 20, "yellow"],
  ["Matchup", 20, "red"],
  ["Market", 15, "gray"]
];

/* =========================================================
   SMALL SHARED COMPONENTS
   ========================================================= */

function BrandDots() {
  return (
    <div className="brand-dots">
      <span className="brand-dot blue" />
      <span className="brand-dot green" />
      <span className="brand-dot red" />
      <span className="brand-dot yellow" />
    </div>
  );
}

function TeamBadge({ team }) {
  return (
    <span className="team-badge">
      {team}
    </span>
  );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function Sidebar({
  activePage,
  setActivePage,
  mobileOpen,
  setMobileOpen
}) {
  return (
    <>
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <button
          className="sidebar-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={21} />
        </button>

        <div className="brand">
          <div className="brand-logo-plate">
            <img
              src="/banana-bets-logo.png"
              alt="Banana Bets"
              className="brand-logo"
            />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              BANANA <strong>BETS</strong>
            </div>

            <div className="brand-subtitle">
              NFL MODEL + BETTING ANALYTICS
            </div>

            <div className="brand-tagline">
              Peel back the numbers.
            </div>
          </div>
        </div>

        <div className="nav-label">
          MENU
        </div>

        <nav className="nav-menu">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-button ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />

                <span>
                  {item.name}
                </span>

                {item.badge && (
                  <span className="nav-badge">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-controller-dots">
            <span className="control-dot green" />
            <span className="control-dot blue" />
            <span className="control-dot red" />
            <span className="control-dot yellow" />
          </div>

          <p>
            BANANA BETS
            <br />
            MODEL DASHBOARD
          </p>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

/* =========================================================
   TOP BAR
   ========================================================= */

function Topbar({
  season,
  setSeason,
  week,
  setWeek,
  setMobileOpen
}) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="mobile-brand">
        <img
          src="/banana-bets-logo.png"
          alt="Banana Bets"
        />

        <span>
          BANANA <strong>BETS</strong>
        </span>
      </div>

      <div className="selector">
        <label>
          Season
        </label>

        <div className="select-shell">
          <select
            value={season}
            onChange={(e) =>
              setSeason(e.target.value)
            }
          >
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </select>

          <ChevronDown size={14} />
        </div>
      </div>

      <div className="selector week-selector">
        <label>
          Week
        </label>

        <div className="select-shell">
          <select
            value={week}
            onChange={(e) =>
              setWeek(e.target.value)
            }
          >
            {Array.from(
              { length: 18 },
              (_, index) => (
                <option key={index + 1}>
                  Week {index + 1}
                </option>
              )
            )}
          </select>

          <ChevronDown size={14} />
        </div>
      </div>

      <div className="next-games">
        <span>
          Next Games
        </span>

        <strong>
          3d 12h 24m
        </strong>
      </div>

      <div className="demo-status">
        <span className="demo-status-dot" />

        <div>
          <strong>
            SAMPLE DATA
          </strong>

          <span>
            Model connection pending
          </span>
        </div>
      </div>

      <div className="search-shell">
        <Search size={18} />

        <input
          placeholder="Search teams, games, players..."
        />
      </div>

      <button
        className="profile-button"
        aria-label="Profile"
      >
        <User size={19} />
      </button>
    </header>
  );
}

/* =========================================================
   HERO / WEEKLY COMMAND CENTER
   ========================================================= */

function HeroHighlightCard({
  label,
  title,
  primary,
  secondary,
  meta,
  accent,
  icon
}) {
  return (
    <div className={`highlight-card ${accent}`}>
      <div className="highlight-card-header">
        <span className="highlight-icon">
          {icon}
        </span>

        <span className="highlight-label">
          {label}
        </span>
      </div>

      <div className="highlight-title">
        {title}
      </div>

      <div className="highlight-primary">
        {primary}
      </div>

      <div className="highlight-secondary">
        {secondary}
      </div>

      <div className="highlight-meta">
        {meta}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-heading-row">
        <div>
          <div className="eyebrow">
            WEEKLY COMMAND CENTER
          </div>

          <h1>
            WEEK 1 SNAPSHOT
          </h1>

          <div className="hero-brand-message">
            <span>
              NFL MODEL + BETTING ANALYTICS
            </span>

            <strong>
              Peel back the numbers.
            </strong>
          </div>
        </div>

        <div className="hero-week-status">
          <span>
            2026 REGULAR SEASON
          </span>

          <strong>
            16 GAMES
          </strong>

          <small>
            Current slate
          </small>
        </div>
      </div>

      <div className="hero-highlight-grid">
        <HeroHighlightCard
          label="BEST EDGE"
          title="MIA MONEYLINE"
          primary="+8.4% EV"
          secondary="Model: 61% · Market: 51%"
          meta="+150 sportsbook price"
          accent="highlight-yellow"
          icon={<Trophy size={18} />}
        />

        <HeroHighlightCard
          label="PROP WATCH"
          title="J. ALLEN O37.5 RUSH YDS"
          primary="44.2 YDS"
          secondary="Model projection"
          meta="7.2 yards above line"
          accent="highlight-blue"
          icon={<Target size={18} />}
        />

        <HeroHighlightCard
          label="TREND WATCH"
          title="RUSH YARDS OVER"
          primary="4 OF LAST 5"
          secondary="Recent games above line"
          meta="3 straight entering this week"
          accent="highlight-green"
          icon={<TrendingUp size={18} />}
        />

        <HeroHighlightCard
          label="MARKET MOVE"
          title="BUF SPREAD"
          primary="-2.5 → -3.5"
          secondary="Line moved one point"
          meta="Watch price before kickoff"
          accent="highlight-red"
          icon={<Activity size={18} />}
        />
      </div>

      <div className="model-alert">
        <div className="model-alert-left">
          <span className="model-alert-label">
            MODEL VS MARKET
          </span>

          <strong>
            MIA @ LV
          </strong>

          <span className="model-alert-description">
            One of the largest model-market disagreements
            on the current slate.
          </span>
        </div>

        <div className="model-alert-numbers">
          <div>
            <span>
              MODEL
            </span>

            <strong className="blue-text">
              61%
            </strong>
          </div>

          <div className="alert-divider" />

          <div>
            <span>
              MARKET
            </span>

            <strong>
              51%
            </strong>
          </div>

          <div className="alert-divider" />

          <div>
            <span>
              GAP
            </span>

            <strong className="green-text">
              +10.0
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   METRICS
   ========================================================= */

function MetricCard({
  icon,
  value,
  label,
  accent
}) {
  return (
    <div className={`metric-card ${accent}`}>
      <div className="metric-icon">
        {icon}
      </div>

      <div>
        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>
      </div>
    </div>
  );
}

function Metrics() {
  return (
    <section className="metrics">
      <MetricCard
        icon={<TrendingUp size={24} />}
        value="+12.4%"
        label="ROI"
        accent="green-accent"
      />

      <MetricCard
        icon={<Target size={24} />}
        value="58.3%"
        label="Win Rate"
        accent="blue-accent"
      />

      <MetricCard
        icon={<Database size={24} />}
        value="1,287"
        label="Games Analyzed"
        accent="gray-accent"
      />

      <MetricCard
        icon={<Activity size={24} />}
        value="7-3"
        label="Last 10 Picks"
        accent="red-accent"
      />

      <MetricCard
        icon={<Trophy size={24} />}
        value="+8.2%"
        label="Average Edge"
        accent="yellow-accent"
      />
    </section>
  );
}

/* =========================================================
   PREDICTIONS TABLE
   ========================================================= */

function PredictionsTable() {
  return (
    <section className="panel predictions-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">
            CURRENT SLATE
          </span>

          <h2>
            Week 1 Predictions
          </h2>
        </div>

        <button className="panel-link">
          View All Games →
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Matchup</th>
              <th>Spread</th>
              <th>Total</th>
              <th>Moneyline</th>
              <th>Win Prob</th>
              <th>Edge</th>
              <th>Pick</th>
            </tr>
          </thead>

          <tbody>
            {GAMES.map(
              (game, index) => (
                <tr key={index}>
                  <td className="date-cell">
                    {game.date}
                  </td>

                  <td>
                    <div className="matchup">
                      <TeamBadge team={game.away} />

                      <span className="at">
                        @
                      </span>

                      <TeamBadge team={game.home} />
                    </div>
                  </td>

                  <td>
                    {game.spread}
                  </td>

                  <td>
                    {game.total}
                  </td>

                  <td>
                    <div>
                      {game.away} {game.awayML}
                    </div>

                    <div>
                      {game.home} {game.homeML}
                    </div>
                  </td>

                  <td>
                    <span className="probability-pill">
                      {game.probability}%
                    </span>
                  </td>

                  <td>
                    <span className="edge-positive">
                      +{game.edge.toFixed(1)}%
                    </span>
                  </td>

                  <td>
                    <button
                      className={`pick-button ${
                        game.pick === "PASS"
                          ? "pass"
                          : ""
                      }`}
                    >
                      {game.pick}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* =========================================================
   CONFIDENCE CARD
   ========================================================= */

function ConfidenceCard() {
  const counts = useMemo(
    () => ({
      high: GAMES.filter(
        (game) => game.confidence === "high"
      ).length,

      medium: GAMES.filter(
        (game) => game.confidence === "medium"
      ).length,

      low: GAMES.filter(
        (game) => game.confidence === "low"
      ).length
    }),
    []
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">
            MODEL QUALITY
          </span>

          <h3>
            Confidence
          </h3>
        </div>
      </div>

      <div className="confidence-content">
        <div className="confidence-ring">
          <div className="ring-center">
            <strong>
              {GAMES.length}
            </strong>

            <span>
              Featured
            </span>
          </div>
        </div>

        <div className="confidence-list">
          <div>
            <span className="legend blue" />

            High

            <strong>
              {counts.high}
            </strong>
          </div>

          <div>
            <span className="legend green" />

            Medium

            <strong>
              {counts.medium}
            </strong>
          </div>

          <div>
            <span className="legend gray" />

            Low

            <strong>
              {counts.low}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   BETTING ANGLES
   ========================================================= */

function BettingAngles() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">
            TRENDS
          </span>

          <h3>
            Top Betting Angles
          </h3>
        </div>
      </div>

      <div className="angles">
        {ANGLES.map(
          ([label, percentage], index) => (
            <div
              className="angle-row"
              key={label}
            >
              <span className="angle-number">
                {index + 1}
              </span>

              <span className="angle-label">
                {label}
              </span>

              <strong>
                {percentage}
              </strong>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   BET TRACKER
   ========================================================= */

function BetTracker() {
  return (
    <section className="panel bet-tracker">
      <div className="tracker-icon">
        <TrendingUp size={27} />
      </div>

      <div>
        <h3>
          My Bets
        </h3>

        <p>
          Track units, results, CLV and ROI.
        </p>
      </div>

      <button className="tracker-button">
        Open
      </button>
    </section>
  );
}

/* =========================================================
   WIN PROBABILITY
   ========================================================= */

function WinProbability() {
  return (
    <section className="panel">
      <span className="panel-kicker">
        PROJECTIONS
      </span>

      <h3>
        Win Probability
      </h3>

      <div className="probability-list">
        {PROBABILITIES.map(
          ([team, value]) => (
            <div
              className="probability-row"
              key={team}
            >
              <TeamBadge team={team} />

              <div className="progress">
                <div
                  className="progress-fill"
                  style={{
                    width: `${value}%`
                  }}
                />
              </div>

              <strong>
                {value}%
              </strong>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   MODEL COMPONENTS
   ========================================================= */

function ModelComponents() {
  return (
    <section className="panel">
      <span className="panel-kicker">
        ENGINE
      </span>

      <h3>
        Model Components
      </h3>

      <div className="selected-game">
        MIA @ LV
      </div>

      <div className="component-list">
        {COMPONENTS.map(
          ([name, value, color]) => (
            <div
              className="component-row"
              key={name}
            >
              <span>
                {name}
              </span>

              <div className="component-track">
                <div
                  className={`component-fill ${color}`}
                  style={{
                    width: `${value * 3.2}%`
                  }}
                />
              </div>

              <strong>
                {value}%
              </strong>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   INSIGHTS
   ========================================================= */

function LatestInsights() {
  return (
    <section className="panel insights-panel">
      <span className="panel-kicker">
        MODEL NOTES
      </span>

      <h3>
        Latest Insights
      </h3>

      <div className="insights">
        <button>
          <span className="insight-dot blue" />

          Model weights and calibration
        </button>

        <button>
          <span className="insight-dot green" />

          Best values this week
        </button>

        <button>
          <span className="insight-dot yellow" />

          Market movement report
        </button>

        <button>
          <span className="insight-dot red" />

          High-risk disagreement games
        </button>

        <button>
          <span className="insight-dot gray" />

          Model performance history
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard() {
  return (
    <>
      <Hero />

      <Metrics />

      <div className="main-dashboard">
        <PredictionsTable />

        <aside className="right-dashboard">
          <ConfidenceCard />

          <BettingAngles />

          <BetTracker />
        </aside>
      </div>

      <div className="bottom-dashboard">
        <WinProbability />

        <ModelComponents />

        <LatestInsights />
      </div>
    </>
  );
}

/* =========================================================
   PLACEHOLDER PAGES
   ========================================================= */

function Placeholder({ page }) {
  return (
    <section className="placeholder panel">
      <img
        src="/banana-bets-logo.png"
        alt=""
      />

      <h1>
        {page}
      </h1>

      <p>
        This section is ready for its Banana Bets data
        view. Navigation already works, so this page can
        later connect directly to the appropriate model
        output.
      </p>
    </section>
  );
}

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const [
    activePage,
    setActivePage
  ] = useState("Dashboard");

  const [
    mobileOpen,
    setMobileOpen
  ] = useState(false);

  const [
    season,
    setSeason
  ] = useState("2026");

  const [
    week,
    setWeek
  ] = useState("Week 1");

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="site">
        <Topbar
          season={season}
          setSeason={setSeason}
          week={week}
          setWeek={setWeek}
          setMobileOpen={setMobileOpen}
        />

        <main className="content">
          {activePage === "Dashboard" ? (
            <Dashboard />
          ) : (
            <Placeholder page={activePage} />
          )}
        </main>

        <footer>
          <div className="footer-brand">
            <BrandDots />

            <strong>
              BANANA BETS
            </strong>
          </div>

          <div>
            Model
            <span>•</span>
            Data
            <span>•</span>
            Bet Log
          </div>
        </footer>
      </div>
    </div>
  );
}