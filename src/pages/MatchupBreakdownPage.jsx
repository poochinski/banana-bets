import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CloudSun,
  Gauge,
  MapPin,
  Shield,
  ShieldAlert,
  Swords,
  Target,
  ThermometerSun,
  TrendingUp,
  Tv,
  Umbrella,
  Wind,
  Zap
} from "lucide-react";
import InfoTooltip from "../components/InfoTooltip";
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

function normalizeTeam(team) {
  const key = String(team || "").trim().toUpperCase();
  return TEAM_ALIASES[key] || key;
}

function helmetUrl(team) {
  return `https://www.fantasynerds.com/images/nfl/helmets/${normalizeTeam(team)}.png`;
}

function americanOdds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const rounded = Math.round(number);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function percent(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${(number * 100).toFixed(digits)}%`;
}

function signedPercent(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const formatted = (number * 100).toFixed(digits);
  return `${number >= 0 ? "+" : ""}${formatted}%`;
}

function signedPoints(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const formatted = (number * 100).toFixed(digits);
  return `${number >= 0 ? "+" : ""}${formatted} pp`;
}

function splitMatchup(matchup) {
  const parts = String(matchup || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(/\s+(?:@|vs\.?|VS)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    away: parts[0] || "AWAY",
    home: parts[1] || "HOME"
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
    const awayRow =
      game.rows.find((row) => normalizeTeam(row.team) === normalizeTeam(game.away)) ||
      game.rows[0] ||
      null;

    const homeRow =
      game.rows.find((row) => normalizeTeam(row.team) === normalizeTeam(game.home)) ||
      game.rows.find((row) => row !== awayRow) ||
      null;

    return { ...game, awayRow, homeRow };
  });
}

function Helmet({ team, side }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`matchup-helmet ${side}`}>
      {!failed ? (
        <img
          src={helmetUrl(team)}
          alt={`${team} football helmet`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="helmet-fallback"><span>{team}</span></div>
      )}
    </div>
  );
}

function MarketTeamCard({ team, row }) {
  return (
    <div className="market-team-card">
      <span className="market-team-name">{team}</span>
      <div><small>Sportsbook odds</small><strong>{row ? americanOdds(row.american_odds) : "—"}</strong></div>
      <div><small>Banana probability</small><strong className="blue-value">{row ? percent(row.model_win_prob) : "—"}</strong></div>
      <div><small>Market probability</small><strong>{row ? percent(row.market_win_prob) : "—"}</strong></div>
      <div>
        <small>Model edge</small>
        <strong className={Number(row?.edge_vs_market) >= 0 ? "green-value" : "red-value"}>
          {row ? signedPoints(row.edge_vs_market) : "—"}
        </strong>
      </div>
    </div>
  );
}

function kickoffLabel(date) {
  if (!date) return "Kickoff TBD";

  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString();
  }
}

function ContextCard({ icon: Icon, label, value, subvalue }) {
  return (
    <div className="matchup-context-fact">
      <span className="matchup-context-fact-icon"><Icon size={17} /></span>
      <div>
        <small>{label}</small>
        <strong>{value || "—"}</strong>
        {subvalue && <span>{subvalue}</span>}
      </div>
    </div>
  );
}

const STAT_GROUPS = [
  {
    title: "Scoring & Production",
    icon: TrendingUp,
    help: "Season scoring and yardage production. Early in a new season Banana uses the previous season as a clearly labeled baseline until current-season games exist.",
    stats: [
      ["Points / Game", "pointsPerGame"],
      ["Total Yards / Game", "yardsPerGame"],
      ["Pass Yards / Game", "passYardsPerGame"],
      ["Rush Yards / Game", "rushYardsPerGame"]
    ]
  },
  {
    title: "Efficiency & Drives",
    icon: Gauge,
    help: "Efficiency statistics help show how much production teams create per play and how consistently they sustain drives.",
    stats: [
      ["Yards / Play", "yardsPerPlay"],
      ["3rd Down %", "thirdDownPct"],
      ["Red Zone %", "redZonePct"],
      ["First Downs / Game", "firstDownsPerGame"]
    ]
  },
  {
    title: "Turnovers & Discipline",
    icon: Target,
    help: "Turnover margin and penalties can materially change field position, possessions, and scoring opportunity.",
    stats: [
      ["Turnover Differential", "turnoverDifferential"],
      ["Giveaways", "giveaways"],
      ["Penalties", "penalties"],
      ["Penalty Yards", "penaltyYards"]
    ]
  },
  {
    title: "Defensive Results",
    icon: Shield,
    help: "Defensive season results when ESPN exposes them for the selected season. Missing values remain blank rather than being estimated.",
    stats: [
      ["Points Allowed / Game", "pointsAllowedPerGame"],
      ["Yards Allowed / Game", "yardsAllowedPerGame"],
      ["Pass Yards Allowed / Game", "passYardsAllowedPerGame"],
      ["Rush Yards Allowed / Game", "rushYardsAllowedPerGame"]
    ]
  }
];

function ResearchGroup({ group, awayData, homeData, loading }) {
  const Icon = group.icon;

  return (
    <section className="panel matchup-stat-card">
      <div className="matchup-stat-card-title">
        <span><Icon size={17} /></span>
        <h3>{group.title}</h3>
        <InfoTooltip label={group.title}>{group.help}</InfoTooltip>
      </div>

      <div className="matchup-stat-table">
        {group.stats.map(([label, keyName]) => (
          <div className="matchup-stat-row" key={keyName}>
            <strong className={!awayData?.[keyName] ? "stat-pending" : ""}>
              {loading ? "…" : formatStat(awayData?.[keyName])}
            </strong>
            <span className="matchup-stat-label">{label}</span>
            <strong className={!homeData?.[keyName] ? "stat-pending" : ""}>
              {loading ? "…" : formatStat(homeData?.[keyName])}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function InjuryTeam({ team, injuries, loading }) {
  return (
    <div className="matchup-injury-team">
      <div className="matchup-injury-team-title">
        <strong>{team}</strong>
        <span>{loading ? "Loading…" : `${injuries.length} listed`}</span>
      </div>

      {loading ? (
        <div className="matchup-injury-empty">Loading injury report…</div>
      ) : injuries.length ? (
        <div className="matchup-injury-list">
          {injuries.slice(0, 5).map((injury, index) => (
            <div key={`${injury.name}-${index}`}>
              <span><b>{injury.name}</b>{injury.position ? ` · ${injury.position}` : ""}</span>
              <strong>{injury.status}</strong>
              {injury.detail && <small>{injury.detail}</small>}
            </div>
          ))}
        </div>
      ) : (
        <div className="matchup-injury-empty">No injury entries returned.</div>
      )}
    </div>
  );
}

function WeatherPanel({ weather, loading }) {
  if (loading) return <div className="matchup-weather-loading">Loading game-time weather…</div>;
  if (!weather) return <div className="matchup-weather-loading">Weather data unavailable.</div>;

  if (weather.indoor) {
    return (
      <div className="matchup-weather-indoor">
        <CloudSun size={23} />
        <div><strong>{weather.condition}</strong><span>{weather.note}</span></div>
      </div>
    );
  }

  if (weather.unavailable) {
    return (
      <div className="matchup-weather-indoor">
        <CloudSun size={23} />
        <div><strong>Forecast not available yet</strong><span>{weather.note}</span></div>
      </div>
    );
  }

  return (
    <div className="matchup-weather-grid">
      <ContextCard icon={ThermometerSun} label="Temperature" value={weather.temperature != null ? `${Math.round(weather.temperature)}°F` : "—"} subvalue={weather.feelsLike != null ? `Feels ${Math.round(weather.feelsLike)}°F` : weather.condition} />
      <ContextCard icon={Wind} label="Wind" value={weather.wind != null ? `${Math.round(weather.wind)} mph` : "—"} subvalue={weather.gusts != null ? `Gusts ${Math.round(weather.gusts)} mph` : ""} />
      <ContextCard icon={Umbrella} label="Precipitation" value={weather.precipitationProbability != null ? `${Math.round(weather.precipitationProbability)}%` : (weather.precipitation != null ? `${weather.precipitation} in` : "—")} subvalue={weather.condition} />
    </div>
  );
}

export default function MatchupBreakdownPage({ rows, season, week }) {
  const games = useMemo(() => buildGames(rows), [rows]);
  const [selectedGameId, setSelectedGameId] = useState(() => sessionStorage.getItem("banana-bets:selected-matchup") || "");

  const selected = games.find((game) => game.id === selectedGameId) || games[0] || null;

  const currentGamesUsed = useMemo(() => {
    if (!selected?.rows?.length) return 0;
    return Math.max(0, ...selected.rows.map((row) => Number(row.games_used) || 0));
  }, [selected]);

  const statSeason = currentGamesUsed > 0 ? Number(season) : Number(season) - 1;
  const statSeasonLabel = currentGamesUsed > 0 ? `${statSeason} current-season stats` : `${statSeason} previous-season baseline`;

  const [gameContext, setGameContext] = useState(null);
  const [awayStats, setAwayStats] = useState(null);
  const [homeStats, setHomeStats] = useState(null);
  const [awayInjuries, setAwayInjuries] = useState([]);
  const [homeInjuries, setHomeInjuries] = useState([]);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");

  useEffect(() => {
    if (!selected) return undefined;

    let cancelled = false;

    async function loadContext() {
      setContextLoading(true);
      setContextError("");

      const [gameResult, awayStatsResult, homeStatsResult, awayInjuryResult, homeInjuryResult] = await Promise.allSettled([
        getWeekGameContext({ season: Number(season), week: Number(String(week).match(/\d+/)?.[0] || 1), away: selected.away, home: selected.home }),
        getTeamSeasonStats(selected.away, statSeason),
        getTeamSeasonStats(selected.home, statSeason),
        getTeamInjuries(selected.away),
        getTeamInjuries(selected.home)
      ]);

      if (cancelled) return;

      setGameContext(gameResult.status === "fulfilled" ? gameResult.value : null);
      setAwayStats(awayStatsResult.status === "fulfilled" ? awayStatsResult.value : null);
      setHomeStats(homeStatsResult.status === "fulfilled" ? homeStatsResult.value : null);
      setAwayInjuries(awayInjuryResult.status === "fulfilled" ? awayInjuryResult.value : []);
      setHomeInjuries(homeInjuryResult.status === "fulfilled" ? homeInjuryResult.value : []);

      const failures = [gameResult, awayStatsResult, homeStatsResult].filter((result) => result.status === "rejected");
      if (failures.length) setContextError("Some public matchup data could not be loaded. Banana model data is still shown below.");

      setContextLoading(false);
    }

    loadContext();
    return () => { cancelled = true; };
  }, [selected?.id, selected?.away, selected?.home, season, week, statSeason]);

  if (!selected) {
    return (
      <section className="matchup-page">
        <section className="panel matchup-empty">
          <Swords size={32} />
          <h2>No matchup data loaded</h2>
          <p>Select a season and week with Bet Finder rows to populate this page.</p>
        </section>
      </section>
    );
  }

  const venueLocation = [gameContext?.city, gameContext?.state].filter(Boolean).join(", ");
  const broadcasts = gameContext?.broadcast?.join(", ") || "Broadcast TBD";

  return (
    <section className="matchup-page matchup-page-v2">
      <div className="matchup-page-topbar">
        <div>
          <span className="product-page-eyebrow">RESEARCH CENTER</span>
          <h1>Matchup Breakdown</h1>
          <p>Compare Banana’s model, the sportsbook market, real team statistics, injuries, venue, kickoff information, and game-time weather.</p>
        </div>

        <label className="matchup-game-picker">
          <span>Select game</span>
          <select
            value={selected?.id || ""}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedGameId(value);
              sessionStorage.setItem("banana-bets:selected-matchup", value);
            }}
          >
            {games.map((game) => <option key={game.id} value={game.id}>{game.matchup}</option>)}
          </select>
        </label>
      </div>

      {contextError && <div className="matchup-data-warning"><ShieldAlert size={15} /> {contextError}</div>}

      <section className="matchup-showdown">
        <div className="matchup-team matchup-team-away">
          <Helmet team={selected.away} side="away" />
          <div className="matchup-team-copy">
            <span>AWAY · {gameContext?.awayRecord || "—"}</span>
            <h2>{selected.away}</h2>
          </div>
        </div>

        <div className="matchup-center">
          <span className="matchup-week">{season} · {week}</span>
          <strong className="matchup-vs">VS</strong>
          <span className="matchup-name">{selected.matchup}</span>
          <div className="matchup-live-badge"><Activity size={13} /> Banana model + live context</div>
        </div>

        <div className="matchup-team matchup-team-home">
          <div className="matchup-team-copy">
            <span>HOME · {gameContext?.homeRecord || "—"}</span>
            <h2>{selected.home}</h2>
          </div>
          <Helmet team={selected.home} side="home" />
        </div>
      </section>

      <section className="matchup-game-context-strip">
        <ContextCard icon={CalendarDays} label="Kickoff" value={contextLoading ? "Loading…" : kickoffLabel(gameContext?.date)} subvalue={gameContext?.status} />
        <ContextCard icon={MapPin} label="Venue" value={contextLoading ? "Loading…" : (gameContext?.venueName || "Venue unavailable")} subvalue={venueLocation || (gameContext?.indoor ? "Indoor" : "")} />
        <ContextCard icon={Tv} label="Broadcast" value={contextLoading ? "Loading…" : broadcasts} subvalue={gameContext?.indoor ? "Indoor / roofed" : gameContext ? "Outdoor venue" : ""} />
      </section>

      <section className="matchup-three-layers">
        <div className="matchup-layer model-layer"><span>🍌 BANANA</span><strong>Model</strong><small>Probability, edge, EV and fair price.</small></div>
        <div className="matchup-layer research-layer"><span>📊 MATCHUP</span><strong>Football Data</strong><small>Real season stats, injuries and game environment.</small></div>
        <div className="matchup-layer market-layer"><span>💰 MARKET</span><strong>Sportsbook</strong><small>What price is the market currently offering?</small></div>
      </section>

      <section className="panel matchup-market-panel">
        <div className="panel-header">
          <div><span className="panel-kicker">BANANA + MARKET</span><h2>Model vs. Market</h2></div>
          <InfoTooltip label="Model vs. Market">These values come from the Banana Bets API. The matchup page does not recreate the model calculation in React.</InfoTooltip>
        </div>

        <div className="market-team-grid">
          <MarketTeamCard team={selected.away} row={selected.awayRow} />
          <div className="market-divider"><span>VS</span></div>
          <MarketTeamCard team={selected.home} row={selected.homeRow} />
        </div>

        <div className="matchup-market-summary">
          <div><small>Away EV</small><strong className={Number(selected.awayRow?.ev) >= 0 ? "green-value" : "red-value"}>{selected.awayRow ? signedPercent(selected.awayRow.ev) : "—"}</strong></div>
          <div><small>Away fair odds</small><strong>{selected.awayRow ? americanOdds(selected.awayRow.fair_odds) : "—"}</strong></div>
          <div><small>Home fair odds</small><strong>{selected.homeRow ? americanOdds(selected.homeRow.fair_odds) : "—"}</strong></div>
          <div><small>Home EV</small><strong className={Number(selected.homeRow?.ev) >= 0 ? "green-value" : "red-value"}>{selected.homeRow ? signedPercent(selected.homeRow.ev) : "—"}</strong></div>
        </div>
      </section>

      <div className="matchup-research-heading">
        <div><span className="panel-kicker">TEAM STATISTICS</span><h2>Head-to-Head Statistical Profile</h2></div>
        <span className="research-source-badge">ESPN · {statSeasonLabel}</span>
      </div>

      <div className="matchup-research-grid">
        {STAT_GROUPS.map((group) => (
          <ResearchGroup key={group.title} group={group} awayData={awayStats} homeData={homeStats} loading={contextLoading} />
        ))}
      </div>

      <div className="matchup-bottom-grid matchup-bottom-grid-v2">
        <section className="panel matchup-environment-card">
          <div className="panel-header">
            <div><span className="panel-kicker">GAME ENVIRONMENT</span><h3>Game-Time Weather</h3></div>
            <CloudSun size={22} />
          </div>
          <WeatherPanel weather={gameContext?.weather} loading={contextLoading} />
          <p className="matchup-source-note">Weather: Open-Meteo at the venue city near kickoff. Forecasts become more useful as game time approaches.</p>
        </section>

        <section className="panel matchup-injuries-card">
          <div className="panel-header">
            <div><span className="panel-kicker">PERSONNEL</span><h3>Current Injury Report</h3></div>
            <Zap size={22} />
          </div>
          <div className="matchup-injury-grid">
            <InjuryTeam team={selected.away} injuries={awayInjuries} loading={contextLoading} />
            <InjuryTeam team={selected.home} injuries={homeInjuries} loading={contextLoading} />
          </div>
          <p className="matchup-source-note">Injuries: ESPN public team injury feed. Availability can change through game day.</p>
        </section>
      </div>

      <section className="matchup-source-bar">
        <span><b>Banana API:</b> model probability, market probability, fair odds, edge, EV, confidence.</span>
        <span><b>ESPN:</b> schedule, venue, records, team stats, injuries.</span>
        <span><b>Open-Meteo:</b> game-time weather.</span>
      </section>
    </section>
  );
}
