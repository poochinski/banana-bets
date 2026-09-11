import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CloudSun,
  MapPin,
  ShieldAlert,
  Swords,
  Tv,
  Wind
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

function PixelHelmet({ team }) {
  const normalized = normalizeTeam(team);
  const position = SPRITE_POSITIONS[normalized];

  if (!position) {
    return <div className="retro-helmet-fallback">{normalized}</div>;
  }

  const [column, row] = position;
  return (
    <div
      className="retro-helmet-sprite"
      role="img"
      aria-label={`${normalized} pixel football helmet`}
      style={{
        backgroundPosition: `${-column * 230}px ${-row * 185}px`
      }}
    />
  );
}

function StatCell({ stat }) {
  return <strong>{formatStat(stat)}</strong>;
}

function InjuryColumn({ team, injuries = [] }) {
  return (
    <div className="retro-injury-team">
      <div className="retro-injury-team-title" style={{ "--team-accent": TEAM_COLORS[team] || "#e7b92f" }}>
        {team} {TEAM_NAMES[team]}
      </div>

      {injuries.length ? (
        <div className="retro-injury-list">
          {injuries.slice(0, 5).map((injury, index) => (
            <div className="retro-injury-row" key={`${injury.name}-${index}`}>
              <span>
                <b>{injury.name}</b>
                <small>{injury.position || "—"}</small>
              </span>
              <em>{injury.status || "Listed"}</em>
            </div>
          ))}
        </div>
      ) : (
        <div className="retro-empty-line">No injury entries returned</div>
      )}
    </div>
  );
}

function ContextLine({ label, children }) {
  return (
    <div className="retro-context-line">
      <span>{label}</span>
      <strong>{children || "—"}</strong>
    </div>
  );
}

function MarketRow({ row, team }) {
  return (
    <div className="retro-market-row">
      <div className="retro-market-team" style={{ "--team-accent": TEAM_COLORS[team] || "#e7b92f" }}>
        <span>{team}</span>
        <b>{TEAM_NAMES[team] || team}</b>
      </div>
      <strong>{americanOdds(row?.fair_odds)}</strong>
      <strong>{pct(row?.model_win_prob)}</strong>
      <strong>{pct(row?.market_win_prob)}</strong>
      <strong className={Number(row?.edge_vs_market) >= 0 ? "retro-positive" : "retro-negative"}>
        {signedPp(row?.edge_vs_market)}
      </strong>
      <strong className={Number(row?.ev) >= 0 ? "retro-positive" : "retro-negative"}>
        {signedPct(row?.ev)}
      </strong>
      <span className={`retro-confidence ${String(row?.confidence || "low").toLowerCase()}`}>
        {String(row?.confidence || "—").toUpperCase()}
      </span>
    </div>
  );
}

function TeamStatsTable({ away, home, awayStats, homeStats, statsSeason }) {
  const rows = [
    ["POINTS / GAME", "pointsPerGame"],
    ["YARDS / GAME", "yardsPerGame"],
    ["PASS YDS / GAME", "passYardsPerGame"],
    ["RUSH YDS / GAME", "rushYardsPerGame"],
    ["YARDS / PLAY", "yardsPerPlay"],
    ["3RD DOWN %", "thirdDownPct"],
    ["RED ZONE %", "redZonePct"],
    ["TURNOVER DIFF", "turnoverDifferential"],
    ["POINTS ALLOWED", "pointsAllowedPerGame"],
    ["YARDS ALLOWED", "yardsAllowedPerGame"]
  ];

  return (
    <section className="retro-panel retro-stats-panel" id="retro-stats">
      <div className="retro-panel-title">
        <span>▥</span> TEAM STATS <small>{statsSeason} {statsSeason < new Date().getFullYear() ? "BASELINE" : "SEASON"}</small>
      </div>
      <div className="retro-stats-head">
        <b style={{ color: TEAM_COLORS[away] || "#8dc7ff" }}>{away}</b>
        <span>STAT</span>
        <b style={{ color: TEAM_COLORS[home] || "#8dc7ff" }}>{home}</b>
      </div>
      <div className="retro-stats-body">
        {rows.map(([label, key]) => (
          <div className="retro-stat-row" key={key}>
            <StatCell stat={awayStats?.[key]} />
            <span>{label}</span>
            <StatCell stat={homeStats?.[key]} />
          </div>
        ))}
      </div>
    </section>
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

  return (
    <section className="retro-matchup-page">
      <div className="retro-matchup-toolbar">
        <div>
          <span className="retro-kicker">NFL / MATCHUP BREAKDOWN</span>
          <p>Retro presentation. Real Banana model + public game context.</p>
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
        className="retro-hero"
        style={{
          "--away-accent": TEAM_COLORS[away] || "#1167d8",
          "--home-accent": TEAM_COLORS[home] || "#00a6a6"
        }}
      >
        <div className="retro-stadium-lights retro-stadium-lights-left" />
        <div className="retro-stadium-lights retro-stadium-lights-right" />

        <div className="retro-team-side retro-team-away">
          <PixelHelmet team={away} />
          <span className="retro-team-city">AWAY</span>
          <h2>{TEAM_NAMES[away] || away}</h2>
          <b>{context?.awayRecord || "—"}</b>
          <em>{DIVISIONS[away] || "NFL"}</em>
        </div>

        <div className="retro-scoreboard">
          <span className="retro-board-brand">BANANA BETS</span>
          <h1>MATCHUP<br />BREAKDOWN</h1>
          <div className="retro-board-week">{String(week).toUpperCase()}</div>
          <strong>{formatKickoff(context?.date)}</strong>
          <div className="retro-dot-divider" />
          <b>{context?.venueName || "VENUE TBD"}</b>
          <span>{[context?.city, context?.state].filter(Boolean).join(", ") || "LOCATION TBD"}</span>
          <div className="retro-board-weather">
            <CloudSun size={18} />
            <span>
              {weather?.indoor
                ? "INDOOR / ROOFED"
                : weather?.temperature != null
                  ? `${Math.round(weather.temperature)}° · ${String(weather.condition || "WEATHER").toUpperCase()}`
                  : weather?.unavailable
                    ? "FORECAST PENDING"
                    : "WEATHER LOADING"}
            </span>
          </div>
          {!weather?.indoor && weather?.wind != null && (
            <small>WIND {Math.round(weather.wind)} MPH{weather?.gusts != null ? ` · GUST ${Math.round(weather.gusts)}` : ""}</small>
          )}
        </div>

        <div className="retro-team-side retro-team-home">
          <PixelHelmet team={home} />
          <span className="retro-team-city">HOME</span>
          <h2>{TEAM_NAMES[home] || home}</h2>
          <b>{context?.homeRecord || "—"}</b>
          <em>{DIVISIONS[home] || "NFL"}</em>
        </div>

        <div className="retro-field-line">
          <span>FOOTBALL</span><i>×</i><span>DATA</span><i>×</i><span>BANANA BETS</span>
        </div>
      </section>

      <nav className="retro-tabs">
        {["OVERVIEW", "STATS", "ODDS", "INJURIES", "CONTEXT"].map((tab) => (
          <button
            key={tab}
            className={tab === "OVERVIEW" ? "active" : ""}
            onClick={() => {
              const target = tab === "STATS"
                ? "retro-stats"
                : tab === "INJURIES"
                  ? "retro-injuries"
                  : tab === "CONTEXT"
                    ? "retro-context"
                    : "retro-model";
              document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {tab}
          </button>
        ))}
        <span className="retro-live-chip"><Activity size={12} /> LIVE MODEL DATA</span>
      </nav>

      <div className="retro-content-grid retro-top-grid">
        <section className="retro-panel retro-model-panel" id="retro-model">
          <div className="retro-panel-title"><span>▥</span> BANANA MODEL <b>VS MARKET</b></div>
          <div className="retro-market-head">
            <span>TEAM</span><span>FAIR ODDS</span><span>MODEL</span><span>MARKET</span><span>EDGE</span><span>EV</span><span>CONF.</span>
          </div>
          <MarketRow row={awayRow} team={away} />
          <MarketRow row={homeRow} team={home} />
          <div className="retro-best-bet">
            <span>BEST CURRENT MONEYLINE VALUE</span>
            <strong>{bestTeam} ML {americanOdds(bestRow?.american_odds)}</strong>
            <b className={Number(bestRow?.ev) >= 0 ? "retro-positive" : "retro-negative"}>{signedPct(bestRow?.ev)} EV</b>
            <small>{String(bestRow?.confidence || "—").toUpperCase()} CONFIDENCE</small>
          </div>
        </section>

        <section className="retro-panel retro-context-panel" id="retro-context">
          <div className="retro-panel-title"><span>▣</span> GAME CONTEXT</div>
          {contextLoading && <div className="retro-loading">LOADING PUBLIC GAME DATA...</div>}
          <ContextLine label="KICKOFF"><CalendarDays size={13} /> {formatKickoff(context?.date)}</ContextLine>
          <ContextLine label="STADIUM">{context?.venueName}</ContextLine>
          <ContextLine label="LOCATION"><MapPin size={13} /> {[context?.city, context?.state].filter(Boolean).join(", ")}</ContextLine>
          <ContextLine label="WEATHER"><CloudSun size={13} /> {weather?.condition || (weather?.indoor ? "Indoor" : "—")}</ContextLine>
          <ContextLine label="WIND"><Wind size={13} /> {weather?.wind != null ? `${Math.round(weather.wind)} mph` : weather?.indoor ? "Indoor" : "—"}</ContextLine>
          <ContextLine label="ROOF">{context?.indoor ? "Indoor / Roofed" : "Open air"}</ContextLine>
          <ContextLine label="BROADCAST"><Tv size={13} /> {context?.broadcast?.join(", ") || "—"}</ContextLine>
        </section>
      </div>

      <div className="retro-content-grid retro-middle-grid">
        <TeamStatsTable
          away={away}
          home={home}
          awayStats={awayStats}
          homeStats={homeStats}
          statsSeason={statsSeason}
        />

        <section className="retro-panel retro-injury-panel" id="retro-injuries">
          <div className="retro-panel-title"><ShieldAlert size={16} /> INJURY REPORT</div>
          <div className="retro-injury-columns">
            <InjuryColumn team={away} injuries={awayInjuries} />
            <InjuryColumn team={home} injuries={homeInjuries} />
          </div>
        </section>
      </div>

      <section className="retro-panel retro-take-panel">
        <div className="retro-panel-title"><span>🍌</span> BANANA TAKE <small>DATA-FIRST SUMMARY</small></div>
        <div className="retro-take-body">
          <div>
            <h3>{bestTeam} shows the strongest current moneyline value in Banana's pricing.</h3>
            <p>
              Banana estimates {bestTeam}'s win probability at {pct(bestRow?.model_win_prob)} versus {pct(bestRow?.market_win_prob)} implied by the listed market price. That creates a {signedPp(bestRow?.edge_vs_market)} model-to-market gap and {signedPct(bestRow?.ev)} expected value at {americanOdds(bestRow?.american_odds)}.
            </p>
            <p className="retro-take-note">
              Team statistics shown above are {statsSeason === Number(season) ? `${statsSeason} current-season context` : `${statsSeason} previous-season baseline context`} and are displayed for research; they do not replace Banana's model output.
            </p>
          </div>
          <div className="retro-bottom-line">
            <span>BOTTOM LINE</span>
            <strong>{bestTeam} IS THE BETTER-PRICED SIDE RIGHT NOW.</strong>
            <small>CONFIDENCE: {String(bestRow?.confidence || "—").toUpperCase()} · EV: {signedPct(bestRow?.ev)}</small>
          </div>
        </div>
      </section>

      <div className="retro-source-strip">
        <span><b>BANANA</b> model + market</span>
        <span><b>ESPN</b> schedule · records · stats · injuries</span>
        <span><b>OPEN-METEO</b> weather</span>
      </div>
    </section>
  );
}
