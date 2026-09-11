import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Swords
} from "lucide-react";
import {
  formatStat,
  getTeamInjuries,
  getTeamSeasonStats,
  getWeekGameContext
} from "../services/nflContext";

const TEAM_ALIASES = {
  JAC: "JAX",
  LA: "LAR",
  WSH: "WAS"
};

const TEAM_NAMES = {
  ARI: "CARDINALS",
  ATL: "FALCONS",
  BAL: "RAVENS",
  BUF: "BILLS",
  CAR: "PANTHERS",
  CHI: "BEARS",
  CIN: "BENGALS",
  CLE: "BROWNS",
  DAL: "COWBOYS",
  DEN: "BRONCOS",
  DET: "LIONS",
  GB: "PACKERS",
  HOU: "TEXANS",
  IND: "COLTS",
  JAX: "JAGUARS",
  KC: "CHIEFS",
  LV: "RAIDERS",
  LAC: "CHARGERS",
  LAR: "RAMS",
  MIA: "DOLPHINS",
  MIN: "VIKINGS",
  NE: "PATRIOTS",
  NO: "SAINTS",
  NYG: "GIANTS",
  NYJ: "JETS",
  PHI: "EAGLES",
  PIT: "STEELERS",
  SEA: "SEAHAWKS",
  SF: "49ERS",
  TB: "BUCCANEERS",
  TEN: "TITANS",
  WAS: "COMMANDERS"
};

const DIVISIONS = {
  BAL: "AFC NORTH", CIN: "AFC NORTH", CLE: "AFC NORTH", PIT: "AFC NORTH",
  HOU: "AFC SOUTH", IND: "AFC SOUTH", JAX: "AFC SOUTH", TEN: "AFC SOUTH",
  BUF: "AFC EAST", MIA: "AFC EAST", NE: "AFC EAST", NYJ: "AFC EAST",
  DEN: "AFC WEST", LV: "AFC WEST", LAC: "AFC WEST", KC: "AFC WEST",
  CHI: "NFC NORTH", DET: "NFC NORTH", GB: "NFC NORTH", MIN: "NFC NORTH",
  ATL: "NFC SOUTH", CAR: "NFC SOUTH", NO: "NFC SOUTH", TB: "NFC SOUTH",
  DAL: "NFC EAST", NYG: "NFC EAST", PHI: "NFC EAST", WAS: "NFC EAST",
  ARI: "NFC WEST", LAR: "NFC WEST", SF: "NFC WEST", SEA: "NFC WEST"
};

const TEAM_COLORS = {
  ARI: "#97233f", ATL: "#a71930", BAL: "#241773", BUF: "#00338d",
  CAR: "#0085ca", CHI: "#0b162a", CIN: "#fb4f14", CLE: "#ff3c00",
  DAL: "#003594", DEN: "#fb4f14", DET: "#0076b6", GB: "#203731",
  HOU: "#03202f", IND: "#002c5f", JAX: "#006778", KC: "#e31837",
  LV: "#6d6e71", LAC: "#0080c6", LAR: "#003594", MIA: "#008e97",
  MIN: "#4f2683", NE: "#002244", NO: "#d3bc8d", NYG: "#0b2265",
  NYJ: "#125740", PHI: "#004c54", PIT: "#ffb612", SEA: "#002244",
  SF: "#aa0000", TB: "#d50a0a", TEN: "#4b92db", WAS: "#5a1414"
};

const SPRITE_POSITIONS = {
  BAL: [0, 0], CIN: [1, 0], CLE: [2, 0], PIT: [3, 0],
  HOU: [0, 1], IND: [1, 1], JAX: [2, 1], TEN: [3, 1],
  BUF: [0, 2], MIA: [1, 2], NE: [2, 2], NYJ: [3, 2],
  DEN: [0, 3], LV: [1, 3], LAC: [2, 3], KC: [3, 3],
  CHI: [0, 4], DET: [1, 4], GB: [2, 4], MIN: [3, 4],
  ATL: [0, 5], CAR: [1, 5], NO: [2, 5], TB: [3, 5],
  DAL: [0, 6], NYG: [1, 6], PHI: [2, 6], WAS: [3, 6],
  ARI: [0, 7], LAR: [1, 7], SF: [2, 7], SEA: [3, 7]
};

const TEAM_STATS = [
  ["Points / Game", "pointsPerGame"],
  ["Yards / Game", "yardsPerGame"],
  ["Pass Yards / Game", "passYardsPerGame"],
  ["Rush Yards / Game", "rushYardsPerGame"],
  ["Yards / Play", "yardsPerPlay"],
  ["3rd Down %", "thirdDownPct"],
  ["Red Zone %", "redZonePct"],
  ["Turnover Differential", "turnoverDifferential"],
  ["Points Allowed / Game", "pointsAllowedPerGame"],
  ["Yards Allowed / Game", "yardsAllowedPerGame"]
];

function normalizeTeam(team) {
  const key = String(team || "").trim().toUpperCase();
  return TEAM_ALIASES[key] || key;
}

function splitMatchup(matchup) {
  const parts = String(matchup || "")
    .replace(/\s+/g, " ")
    .split(/\s+(?:@|vs\.?|VS)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    away: normalizeTeam(parts[0] || "AWAY"),
    home: normalizeTeam(parts[1] || "HOME")
  };
}

function buildGames(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    const key = row.game_id || row.matchup;
    if (!key) return;

    if (!groups.has(key)) {
      const teams = splitMatchup(row.matchup || key);
      groups.set(key, {
        id: key,
        matchup: row.matchup || key,
        away: teams.away,
        home: teams.home,
        rows: []
      });
    }

    groups.get(key).rows.push(row);
  });

  return Array.from(groups.values()).map((game) => {
    const awayRow = game.rows.find(
      (row) => normalizeTeam(row.team) === game.away
    ) || game.rows[0] || null;

    const homeRow = game.rows.find(
      (row) => normalizeTeam(row.team) === game.home
    ) || game.rows.find((row) => row !== awayRow) || null;

    return { ...game, awayRow, homeRow };
  });
}

function americanOdds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const rounded = Math.round(number);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function pct(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${(number * 100).toFixed(digits)}%`;
}

function signedPct(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const formatted = (number * 100).toFixed(digits);
  return `${number >= 0 ? "+" : ""}${formatted}%`;
}

function signedPp(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const formatted = (number * 100).toFixed(digits);
  return `${number >= 0 ? "+" : ""}${formatted} pp`;
}

function formatKickoff(dateValue) {
  if (!dateValue) return "KICKOFF TBD";
  const date = new Date(dateValue);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).toUpperCase();
}

function gamesUsed(rows) {
  const samples = rows
    .map((row) => Number(row.games_used))
    .filter(Number.isFinite);
  return samples.length ? Math.min(...samples) : 0;
}

function displayBook(value) {
  if (!value) return "Listed sportsbook";
  const aliases = {
    williamhill: "William Hill",
    fanduel: "FanDuel",
    draftkings: "DraftKings",
    matchbook: "Matchbook",
    marathonbet: "Marathonbet",
    betfair_ex_eu: "Betfair Exchange",
    unibet_se: "Unibet",
    unibet_nl: "Unibet"
  };
  return aliases[value] || String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function PixelHelmet({ team, side = "away" }) {
  const normalized = normalizeTeam(team);
  const position = SPRITE_POSITIONS[normalized];

  if (!position) {
    return <div className="retro-helmet-fallback">{normalized}</div>;
  }

  const [column, row] = position;
  const xPositions = ["0%", "33.333333%", "66.666667%", "100%"];
  const yPositions = ["0%", "14.285714%", "28.571429%", "42.857143%", "57.142857%", "71.428571%", "85.714286%", "100%"];

  return (
    <div
      className={`retro-helmet-direct retro-helmet-${side}`}
      role="img"
      aria-label={`${normalized} ${side} pixel football helmet`}
      style={{
        backgroundPosition: `${xPositions[column]} ${yPositions[row]}`
      }}
    />
  );
}

function HeroContextItem({ icon, label, value }) {
  return (
    <div className="retro-hero-context-item">
      <span className="retro-context-placeholder" aria-hidden="true">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value || "—"}</strong>
      </div>
    </div>
  );
}

function StandardMarketRow({ row, team }) {
  return (
    <div className="matchup-market-data-row">
      <div className="matchup-market-team-cell">
        <span
          className="matchup-team-accent"
          style={{ background: TEAM_COLORS[team] || "#7d8087" }}
        />
        <div>
          <strong>{team}</strong>
          <small>{TEAM_NAMES[team] || team}</small>
        </div>
      </div>
      <strong>{americanOdds(row?.american_odds)}</strong>
      <span>{displayBook(row?.sportsbook)}</span>
      <strong>{americanOdds(row?.fair_odds)}</strong>
      <strong>{pct(row?.model_win_prob)}</strong>
      <strong>{pct(row?.market_win_prob)}</strong>
      <strong className={Number(row?.edge_vs_market) >= 0 ? "green-value" : "red-value"}>
        {signedPp(row?.edge_vs_market)}
      </strong>
      <strong className={Number(row?.ev) >= 0 ? "green-value" : "red-value"}>
        {signedPct(row?.ev)}
      </strong>
      <span className={`confidence-badge ${String(row?.confidence || "low").toLowerCase()}`}>
        {String(row?.confidence || "—").toUpperCase()}
      </span>
    </div>
  );
}

function StandardStats({ away, home, awayStats, homeStats, statsSeason, currentSeason }) {
  return (
    <section className="panel matchup-standard-panel" id="matchup-stats">
      <div className="panel-header matchup-standard-header">
        <div>
          <span className="panel-kicker">TEAM COMPARISON</span>
          <h2>Football Stats</h2>
          <p>
            {statsSeason === currentSeason
              ? `${statsSeason} current-season team context.`
              : `${statsSeason} previous-season baseline while ${currentSeason} has no current-season sample.`}
          </p>
        </div>
        <div className="matchup-team-key">
          <span style={{ "--key-color": TEAM_COLORS[away] || "#888" }}>{away}</span>
          <span style={{ "--key-color": TEAM_COLORS[home] || "#888" }}>{home}</span>
        </div>
      </div>

      <div className="matchup-stats-table">
        <div className="matchup-stats-head">
          <strong>{away}</strong>
          <span>STAT</span>
          <strong>{home}</strong>
        </div>
        {TEAM_STATS.map(([label, key]) => (
          <div className="matchup-standard-stat-row" key={key}>
            <strong>{formatStat(awayStats?.[key])}</strong>
            <span>{label}</span>
            <strong>{formatStat(homeStats?.[key])}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function StandardInjuryColumn({ team, injuries = [] }) {
  return (
    <div className="matchup-injury-team-card">
      <div className="matchup-injury-team-heading">
        <span style={{ background: TEAM_COLORS[team] || "#777" }} />
        <div>
          <strong>{team} {TEAM_NAMES[team]}</strong>
          <small>{injuries.length ? `${injuries.length} listed` : "No listed injuries returned"}</small>
        </div>
      </div>

      {injuries.length ? (
        <div className="matchup-injury-list">
          {injuries.slice(0, 6).map((injury, index) => (
            <div className="matchup-injury-row" key={`${injury.name}-${index}`}>
              <span>
                <strong>{injury.name}</strong>
                <small>{injury.position || "—"}</small>
              </span>
              <em>{injury.status || "Listed"}</em>
            </div>
          ))}
        </div>
      ) : (
        <div className="matchup-injury-empty">No injury entries returned from the public feed.</div>
      )}
    </div>
  );
}

export default function MatchupRetroPage({ rows, season, week }) {
  const games = useMemo(() => buildGames(rows), [rows]);
  const [selectedGameId, setSelectedGameId] = useState(
    () => sessionStorage.getItem("banana-bets:selected-matchup") || ""
  );
  const [context, setContext] = useState(null);
  const [awayStats, setAwayStats] = useState(null);
  const [homeStats, setHomeStats] = useState(null);
  const [awayInjuries, setAwayInjuries] = useState([]);
  const [homeInjuries, setHomeInjuries] = useState([]);
  const [contextLoading, setContextLoading] = useState(false);

  const selected = games.find((game) => game.id === selectedGameId) || games[0] || null;
  const weekNumber = Number(String(week).match(/\d+/)?.[0] || 1);
  const currentGamesUsed = gamesUsed(rows);
  const statsSeason = currentGamesUsed === 0 ? Number(season) - 1 : Number(season);

  useEffect(() => {
    if (!selected) return undefined;

    let cancelled = false;
    setContextLoading(true);

    Promise.allSettled([
      getWeekGameContext({ season: Number(season), week: weekNumber, away: selected.away, home: selected.home }),
      getTeamSeasonStats(selected.away, statsSeason),
      getTeamSeasonStats(selected.home, statsSeason),
      getTeamInjuries(selected.away),
      getTeamInjuries(selected.home)
    ]).then((results) => {
      if (cancelled) return;
      setContext(results[0].status === "fulfilled" ? results[0].value : null);
      setAwayStats(results[1].status === "fulfilled" ? results[1].value : null);
      setHomeStats(results[2].status === "fulfilled" ? results[2].value : null);
      setAwayInjuries(results[3].status === "fulfilled" ? results[3].value : []);
      setHomeInjuries(results[4].status === "fulfilled" ? results[4].value : []);
      setContextLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selected?.id, season, weekNumber, statsSeason]);

  if (!selected) {
    return (
      <section className="retro-matchup-page">
        <div className="retro-empty-state">
          <Swords size={32} />
          <h2>NO MATCHUP DATA LOADED</h2>
          <p>Select a week with game rows to populate the matchup screen.</p>
        </div>
      </section>
    );
  }

  const away = selected.away;
  const home = selected.home;
  const awayRow = selected.awayRow;
  const homeRow = selected.homeRow;
  const weather = context?.weather;
  const bestRow = [awayRow, homeRow]
    .filter(Boolean)
    .sort((a, b) => Number(b.ev || 0) - Number(a.ev || 0))[0];
  const bestTeam = normalizeTeam(bestRow?.team || away);
  const location = [context?.city, context?.state].filter(Boolean).join(", ") || "Location TBD";
  const weatherText = weather?.indoor
    ? "Indoor / roofed"
    : weather?.temperature != null
      ? `${Math.round(weather.temperature)}° · ${weather.condition || "Weather"}`
      : weather?.unavailable
        ? "Forecast pending"
        : "Weather loading";
  const windText = weather?.indoor
    ? "Indoor"
    : weather?.wind != null
      ? `${Math.round(weather.wind)} mph${weather?.gusts != null ? ` · gust ${Math.round(weather.gusts)}` : ""}`
      : "Pending";
  const roofText = context?.indoor ? "Indoor / roofed" : "Open air";
  const broadcastText = context?.broadcast?.join(", ") || "Broadcast TBD";

  return (
    <section className="retro-matchup-page matchup-hybrid-page">
      <div className="retro-matchup-toolbar">
        <div>
          <span className="retro-kicker">NFL / MATCHUP BREAKDOWN</span>
          <p>Retro matchup presentation with Banana Bets research below.</p>
        </div>
        <label>
          <span>SELECT MATCHUP</span>
          <select
            value={selected.id}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedGameId(value);
              sessionStorage.setItem("banana-bets:selected-matchup", value);
            }}
          >
            {games.map((game) => (
              <option value={game.id} key={game.id}>{game.matchup}</option>
            ))}
          </select>
        </label>
      </div>

      <section
        className="retro-hero retro-hero-expanded"
        style={{
          "--away-accent": TEAM_COLORS[away] || "#1167d8",
          "--home-accent": TEAM_COLORS[home] || "#00a6a6"
        }}
      >
        <div className="retro-stadium-lights retro-stadium-lights-left" />
        <div className="retro-stadium-lights retro-stadium-lights-right" />

        <div className="retro-team-side retro-team-away">
          <PixelHelmet team={away} side="away" />
          <span className="retro-team-city">AWAY</span>
          <h2>{TEAM_NAMES[away] || away}</h2>
          <b>{context?.awayRecord || "—"}</b>
          <em>{DIVISIONS[away] || "NFL"}</em>
        </div>

        <div className="retro-scoreboard retro-scoreboard-context">
          <span className="retro-board-brand">BANANA BETS</span>
          <h1>MATCHUP<br />BREAKDOWN</h1>
          <div className="retro-board-week">{String(week).toUpperCase()}</div>
          <strong className="retro-kickoff-line">{formatKickoff(context?.date)}</strong>

          <div className="retro-hero-context-grid">
            <HeroContextItem icon="🏟️" label="STADIUM" value={context?.venueName || "Venue TBD"} />
            <HeroContextItem icon="📍" label="LOCATION" value={location} />
            <HeroContextItem icon="🌤️" label="WEATHER" value={weatherText} />
            <HeroContextItem icon="💨" label="WIND" value={windText} />
            <HeroContextItem icon="🏠" label="ROOF" value={roofText} />
            <HeroContextItem icon="📺" label="BROADCAST" value={broadcastText} />
          </div>

          {contextLoading && <small className="retro-context-loading">LOADING GAME CONTEXT...</small>}
        </div>

        <div className="retro-team-side retro-team-home">
          <PixelHelmet team={home} side="home" />
          <span className="retro-team-city">HOME</span>
          <h2>{TEAM_NAMES[home] || home}</h2>
          <b>{context?.homeRecord || "—"}</b>
          <em>{DIVISIONS[home] || "NFL"}</em>
        </div>

        <div className="retro-field-line">
          <span>FOOTBALL</span><i>×</i><span>DATA</span><i>×</i><span>BANANA BETS</span>
        </div>
      </section>

      <nav className="matchup-standard-tabs">
        <button onClick={() => document.getElementById("matchup-model")?.scrollIntoView({ behavior: "smooth" })}>Overview</button>
        <button onClick={() => document.getElementById("matchup-stats")?.scrollIntoView({ behavior: "smooth" })}>Stats</button>
        <button onClick={() => document.getElementById("matchup-injuries")?.scrollIntoView({ behavior: "smooth" })}>Injuries</button>
        <span><Activity size={13} /> Live model data</span>
      </nav>

      <section className="panel matchup-standard-panel matchup-model-standard" id="matchup-model">
        <div className="panel-header matchup-standard-header">
          <div>
            <span className="panel-kicker">BANANA MODEL VS MARKET</span>
            <h2>Moneyline Comparison</h2>
            <p>Banana's model view, the listed market price, and the gap between them.</p>
          </div>
          <span className="matchup-live-pill"><Activity size={13} /> LIVE</span>
        </div>

        <div className="matchup-market-table">
          <div className="matchup-market-head-row">
            <span>Team</span>
            <span>Listed Odds</span>
            <span>Book</span>
            <span>Fair Odds</span>
            <span>Model</span>
            <span>Market</span>
            <span>Edge</span>
            <span>EV</span>
            <span>Confidence</span>
          </div>
          <StandardMarketRow row={awayRow} team={away} />
          <StandardMarketRow row={homeRow} team={home} />
        </div>

        <div className="matchup-best-value-strip">
          <div>
            <span>BEST CURRENT MONEYLINE VALUE</span>
            <strong>{bestTeam} ML {americanOdds(bestRow?.american_odds)}</strong>
          </div>
          <div>
            <span>MODEL EDGE</span>
            <strong className={Number(bestRow?.edge_vs_market) >= 0 ? "green-value" : "red-value"}>
              {signedPp(bestRow?.edge_vs_market)}
            </strong>
          </div>
          <div>
            <span>EXPECTED VALUE</span>
            <strong className={Number(bestRow?.ev) >= 0 ? "green-value" : "red-value"}>
              {signedPct(bestRow?.ev)}
            </strong>
          </div>
          <div>
            <span>CONFIDENCE</span>
            <strong>{String(bestRow?.confidence || "—").toUpperCase()}</strong>
          </div>
        </div>
      </section>

      <StandardStats
        away={away}
        home={home}
        awayStats={awayStats}
        homeStats={homeStats}
        statsSeason={statsSeason}
        currentSeason={Number(season)}
      />

      <section className="panel matchup-standard-panel" id="matchup-injuries">
        <div className="panel-header matchup-standard-header">
          <div>
            <span className="panel-kicker">PERSONNEL</span>
            <h2>Injury Report</h2>
            <p>Public injury listings for both teams. Availability can change as game day approaches.</p>
          </div>
          <ShieldAlert size={21} />
        </div>
        <div className="matchup-injury-grid">
          <StandardInjuryColumn team={away} injuries={awayInjuries} />
          <StandardInjuryColumn team={home} injuries={homeInjuries} />
        </div>
      </section>

      <section className="panel matchup-standard-panel matchup-take-standard">
        <div className="panel-header matchup-standard-header">
          <div>
            <span className="panel-kicker">BANANA TAKE</span>
            <h2>What the current pricing says</h2>
          </div>
          <span className="matchup-banana-mark">🍌</span>
        </div>

        <div className="matchup-take-layout">
          <div>
            <h3>{bestTeam} currently shows the stronger moneyline value.</h3>
            <p>
              Banana estimates {bestTeam}'s win probability at {pct(bestRow?.model_win_prob)} versus {pct(bestRow?.market_win_prob)} implied by the listed price. That creates a {signedPp(bestRow?.edge_vs_market)} model-to-market gap and {signedPct(bestRow?.ev)} expected value at {americanOdds(bestRow?.american_odds)}.
            </p>
            <p className="matchup-take-note">
              Team statistics are {statsSeason === Number(season) ? `${statsSeason} current-season context` : `${statsSeason} previous-season baseline context`} and are research context, not a replacement for Banana's model output.
            </p>
          </div>

          <div className="matchup-bottom-line-card">
            <span>BOTTOM LINE</span>
            <strong>{bestTeam} IS THE BETTER-PRICED SIDE RIGHT NOW.</strong>
            <small>Confidence: {String(bestRow?.confidence || "—").toUpperCase()} · EV: {signedPct(bestRow?.ev)}</small>
          </div>
        </div>
      </section>

      <div className="matchup-source-strip">
        <span><b>BANANA</b> model + market</span>
        <span><b>ESPN</b> schedule · records · stats · injuries</span>
        <span><b>OPEN-METEO</b> weather</span>
      </div>
    </section>
  );
}
