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

/*
  SAMPLE / DEMO DATA ONLY

  This will eventually be replaced by data coming from the
  Banana Bets Google Sheets / Apps Script API.

  Do not treat these numbers as live model predictions.
*/
const GAMES = [
  {
    date: "Thu 9/10",
    away: "DAL",
    home: "PHI",
    spread: "PHI -6.5",
    total: "47.5",
    awayML: "+210",
    homeML: "-250",
    probability: 72,
    edge: 8.1,
    pick: "PHI -6.5",
    confidence: "high"
  },
  {
    date: "Sun 9/13",
    away: "MIA",
    home: "LV",
    spread: "LV -2.5",
    total: "44.0",
    awayML: "+120",
    homeML: "-140",
    probability: 58,
    edge: 4.3,
    pick: "LV -2.5",
    confidence: "medium"
  },
  {
    date: "Sun 9/13",
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
    away: "KC",
    home: "DEN",
    spread: "KC -4.5",
    total: "47.0",
    awayML: "-200",
    homeML: "+170",
    probability: 67,
    edge: 6.9,
    pick: "KC -4.5",
    confidence: "high"
  },
  {
    date: "Sun 9/13",
    away: "CIN",
    home: "TB",
    spread: "TB -1.0",
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
    away: "ATL",
    home: "PIT",
    spread: "PIT -3.5",
    total: "45.0",
    awayML: "+150",
    homeML: "-175",
    probability: 61,
    edge: 4.9,
    pick: "PIT -3.5",
    confidence: "medium"
  },
  {
    date: "Mon 9/14",
    away: "DEN",
    home: "KC",
    spread: "KC -7.0",
    total: "48.5",
    awayML: "+250",
    homeML: "-300",
    probability: 74,
    edge: 9.2,
    pick: "KC -7.0",
    confidence: "high"
  }
];

const ANGLES = [
  ["Back home favorites", "62%"],
  ["Unders in dome games", "68%"],
  ["Fade short-rest teams", "71%"],
  ["Divisional unders", "64%"],
  ["Elite QB vs weak pass D", "69%"]
];

const PROBABILITIES = [
  ["KC", 74],
  ["PHI", 72],
  ["BAL", 67],
  ["PIT", 63],
  ["LV", 61]
];

const COMPONENTS = [
  ["Power Rating", 25, "blue"],
  ["Recent Form", 20, "green"],
  ["Elo", 20, "yellow"],
  ["Matchup", 20, "red"],
  ["Market", 15, "gray"]
];

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
                  activePage === item.name
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />

                <span>{item.name}</span>

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
            NFL MODEL
            <br />
            + BETTING ANALYTICS
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
        <Menu size={23} />
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
        <label>Season</label>

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
        <label>Week</label>

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
        <span>Next Games</span>

        <strong>
          3d 12h 24m
        </strong>
      </div>

      <div className="demo-status">
        <span className="demo-status-dot" />

        <div>
          <strong>SAMPLE DATA</strong>
          <span>Model connection pending</span>
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

function Hero() {
  return (
    <section className="hero">
      <div className="hero-left">
        <div className="eyebrow">
          NFL MODEL + BETTING ANALYTICS
        </div>

        <h1>
          NFL PREDICTIONS
        </h1>

        <p className="hero-description">
          <strong>
            Peel back the numbers.
          </strong>

          <span>
            Model-driven analysis built to identify value,
            measure uncertainty, and explain the edge.
          </span>
        </p>

        <div className="hero-actions">
          <button className="primary-button">
            View This Week&apos;s Games
          </button>

          <button className="secondary-button">
            How the Model Works
          </button>
        </div>
      </div>

      <div className="hero-right">
        <div className="controller-panel">
          <div className="controller-chart">
            <div className="chart-bar green-bar" />
            <div className="chart-bar red-bar" />
            <div className="chart-bar blue-bar" />
          </div>

          <div className="trend-arrow">
            ↗
          </div>

          <div className="controller-buttons">
            <span className="button-blue" />
            <span className="button-green" />
            <span className="button-red" />
            <span className="button-yellow" />
          </div>
        </div>
      </div>
    </section>
  );
}

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
        icon={<TrendingUp size={25} />}
        value="+12.4%"
        label="ROI"
        accent="green-accent"
      />

      <MetricCard
        icon={<Target size={25} />}
        value="58.3%"
        label="Win Rate"
        accent="blue-accent"
      />

      <MetricCard
        icon={<Database size={25} />}
        value="1,287"
        label="Games Analyzed"
        accent="gray-accent"
      />

      <MetricCard
        icon={<Activity size={25} />}
        value="7-3"
        label="Last 10 Picks"
        accent="red-accent"
      />

      <MetricCard
        icon={<Trophy size={25} />}
        value="+8.2%"
        label="Average Edge"
        accent="yellow-accent"
      />
    </section>
  );
}

function TeamBadge({ team }) {
  return (
    <span className="team-badge">
      {team}
    </span>
  );
}

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
                      <TeamBadge
                        team={game.away}
                      />

                      <span className="at">
                        @
                      </span>

                      <TeamBadge
                        team={game.home}
                      />
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
                      {game.away}{" "}
                      {game.awayML}
                    </div>

                    <div>
                      {game.home}{" "}
                      {game.homeML}
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

function ConfidenceCard() {
  const counts = useMemo(
    () => ({
      high: GAMES.filter(
        (game) =>
          game.confidence === "high"
      ).length,

      medium: GAMES.filter(
        (game) =>
          game.confidence === "medium"
      ).length,

      low: GAMES.filter(
        (game) =>
          game.confidence === "low"
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
            <strong>16</strong>

            <span>
              Games
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

function BetTracker() {
  return (
    <section className="panel bet-tracker">
      <div className="tracker-icon">
        <TrendingUp size={30} />
      </div>

      <div>
        <h3>
          My Bets
        </h3>

        <p>
          Track units, wins, losses,
          CLV and ROI.
        </p>
      </div>

      <button className="tracker-button">
        Open
      </button>
    </section>
  );
}

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
        This section is ready for its
        Banana Bets data view. The
        navigation already works, so we
        can connect this page to the
        appropriate Google Sheets output
        later.
      </p>
    </section>
  );
}

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
            Model Methodology
            <span>•</span>
            Disclaimer
            <span>•</span>
            Contact
          </div>
        </footer>
      </div>
    </div>
  );
}