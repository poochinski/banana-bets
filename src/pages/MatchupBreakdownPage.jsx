import React, { useMemo, useState } from "react";
import {
  Activity,
  CloudSun,
  Gauge,
  Shield,
  Swords,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";
import InfoTooltip from "../components/InfoTooltip";

const TEAM_ALIASES = {
  ARI: "ARI",
  ATL: "ATL",
  BAL: "BAL",
  BUF: "BUF",
  CAR: "CAR",
  CHI: "CHI",
  CIN: "CIN",
  CLE: "CLE",
  DAL: "DAL",
  DEN: "DEN",
  DET: "DET",
  GB: "GB",
  HOU: "HOU",
  IND: "IND",
  JAC: "JAX",
  JAX: "JAX",
  KC: "KC",
  LV: "LV",
  LAC: "LAC",
  LAR: "LAR",
  LA: "LAR",
  MIA: "MIA",
  MIN: "MIN",
  NE: "NE",
  NO: "NO",
  NYG: "NYG",
  NYJ: "NYJ",
  PHI: "PHI",
  PIT: "PIT",
  SEA: "SEA",
  SF: "SF",
  TB: "TB",
  TEN: "TEN",
  WAS: "WAS",
  WSH: "WAS"
};

function normalizeTeam(team) {
  const key = String(team || "")
    .trim()
    .toUpperCase();

  return TEAM_ALIASES[key] || key;
}

function helmetUrl(team) {
  return `https://www.fantasynerds.com/images/nfl/helmets/${normalizeTeam(team)}.png`;
}

function americanOdds(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const rounded = Math.round(number);

  return rounded > 0
    ? `+${rounded}`
    : String(rounded);
}

function percent(value, digits = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${(number * 100).toFixed(digits)}%`;
}

function signedPercent(value, digits = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const formatted =
    (number * 100).toFixed(digits);

  return `${number >= 0 ? "+" : ""}${formatted}%`;
}

function signedPoints(value, digits = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const formatted =
    (number * 100).toFixed(digits);

  return `${number >= 0 ? "+" : ""}${formatted} pp`;
}

function splitMatchup(matchup) {
  const text = String(matchup || "")
    .trim();

  const parts = text
    .replace(/\s+/g, " ")
    .split(/\s+(?:@|vs\.?|VS)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    away:
      parts[0] || "AWAY",
    home:
      parts[1] || "HOME"
  };
}

function buildGames(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    const key =
      row.game_id ||
      row.matchup;

    if (!key) {
      return;
    }

    if (!groups.has(key)) {
      const teams =
        splitMatchup(
          row.matchup ||
          key
        );

      groups.set(key, {
        id: key,
        matchup:
          row.matchup ||
          key,
        away:
          teams.away,
        home:
          teams.home,
        rows: []
      });
    }

    groups.get(key).rows.push(row);
  });

  return Array.from(
    groups.values()
  ).map((game) => {
    const awayRow =
      game.rows.find(
        (row) =>
          normalizeTeam(
            row.team
          ) ===
          normalizeTeam(
            game.away
          )
      ) ||
      game.rows[0] ||
      null;

    const homeRow =
      game.rows.find(
        (row) =>
          normalizeTeam(
            row.team
          ) ===
          normalizeTeam(
            game.home
          )
      ) ||
      game.rows.find(
        (row) =>
          row !== awayRow
      ) ||
      null;

    return {
      ...game,
      awayRow,
      homeRow
    };
  });
}

function Helmet({
  team,
  side
}) {
  const [failed, setFailed] =
    useState(false);

  return (
    <div
      className={`matchup-helmet ${side}`}
    >
      {!failed ? (
        <img
          src={helmetUrl(team)}
          alt={`${team} football helmet`}
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        <div className="helmet-fallback">
          <span>{team}</span>
        </div>
      )}
    </div>
  );
}

function MarketTeamCard({
  team,
  row
}) {
  return (
    <div className="market-team-card">
      <span className="market-team-name">
        {team}
      </span>

      <div>
        <small>
          Sportsbook odds
        </small>

        <strong>
          {row
            ? americanOdds(
                row.american_odds
              )
            : "—"}
        </strong>
      </div>

      <div>
        <small>
          Banana probability
        </small>

        <strong className="blue-value">
          {row
            ? percent(
                row.model_win_prob
              )
            : "—"}
        </strong>
      </div>

      <div>
        <small>
          Market probability
        </small>

        <strong>
          {row
            ? percent(
                row.market_win_prob
              )
            : "—"}
        </strong>
      </div>

      <div>
        <small>
          Model edge
        </small>

        <strong
          className={
            Number(
              row?.edge_vs_market
            ) >= 0
              ? "green-value"
              : "red-value"
          }
        >
          {row
            ? signedPoints(
                row.edge_vs_market
              )
            : "—"}
        </strong>
      </div>
    </div>
  );
}

const STAT_GROUPS = [
  {
    title:
      "Scoring & Efficiency",
    icon:
      TrendingUp,
    help:
      "Core scoring and efficiency stats help show whether a team's production is sustainable and how efficiently it moves the ball.",
    stats: [
      ["Points / Game", "points_per_game"],
      ["Points Allowed / Game", "points_allowed_per_game"],
      ["EPA / Play", "epa_per_play"],
      ["Success Rate", "success_rate"]
    ]
  },
  {
    title:
      "Red Zone",
    icon:
      Target,
    help:
      "Red-zone opportunity and conversion rates help explain how often teams create high-value scoring chances and whether they finish drives.",
    stats: [
      ["Red-Zone Trips / Game", "red_zone_trips"],
      ["Red-Zone TD Rate", "red_zone_td_rate"],
      ["Opponent RZ Trips", "opp_red_zone_trips"],
      ["Opponent RZ TD Rate", "opp_red_zone_td_rate"]
    ]
  },
  {
    title:
      "Explosiveness & Pressure",
    icon:
      Zap,
    help:
      "Explosive plays and pressure rates can materially affect passing props, totals, turnovers, and game volatility.",
    stats: [
      ["Explosive Play Rate", "explosive_play_rate"],
      ["Explosive Plays Allowed", "explosive_allowed"],
      ["Pressure Rate", "pressure_rate"],
      ["Sack Rate", "sack_rate"]
    ]
  },
  {
    title:
      "Pace & Situation",
    icon:
      Gauge,
    help:
      "Pace and situational tendencies influence expected play volume, possession count, and the opportunity available for team and player markets.",
    stats: [
      ["Plays / Game", "plays_per_game"],
      ["Seconds / Snap", "seconds_per_snap"],
      ["3rd Down Rate", "third_down_rate"],
      ["Neutral Pass Rate", "neutral_pass_rate"]
    ]
  }
];

function StatValue({
  value,
  kind
}) {
  const number =
    Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(number)
  ) {
    return (
      <span className="stat-pending">
        —
      </span>
    );
  }

  if (kind === "percent") {
    return (
      <strong>
        {percent(number)}
      </strong>
    );
  }

  return (
    <strong>
      {number.toFixed(1)}
    </strong>
  );
}

function statKind(key) {
  return /rate|percentage|success/i.test(
    key
  )
    ? "percent"
    : "number";
}

function StatRow({
  label,
  keyName,
  awayData,
  homeData
}) {
  return (
    <div className="matchup-stat-row">
      <StatValue
        value={
          awayData?.[
            keyName
          ]
        }
        kind={
          statKind(
            keyName
          )
        }
      />

      <span className="matchup-stat-label">
        {label}
      </span>

      <StatValue
        value={
          homeData?.[
            keyName
          ]
        }
        kind={
          statKind(
            keyName
          )
        }
      />
    </div>
  );
}

function ResearchGroup({
  group,
  awayData,
  homeData
}) {
  const Icon =
    group.icon;

  return (
    <section className="panel matchup-stat-card">
      <div className="matchup-stat-card-title">
        <span>
          <Icon size={17} />
        </span>

        <h3>
          {group.title}
        </h3>

        <InfoTooltip
          label={group.title}
        >
          {group.help}
        </InfoTooltip>
      </div>

      <div className="matchup-stat-table">
        {group.stats.map(
          ([label, keyName]) => (
            <StatRow
              key={keyName}
              label={label}
              keyName={keyName}
              awayData={awayData}
              homeData={homeData}
            />
          )
        )}
      </div>
    </section>
  );
}

export default function MatchupBreakdownPage({
  rows,
  season,
  week
}) {
  const games =
    useMemo(
      () =>
        buildGames(rows),
      [rows]
    );

  const [
    selectedGameId,
    setSelectedGameId
  ] =
    useState("");

  const selected =
    games.find(
      (game) =>
        game.id ===
        selectedGameId
    ) ||
    games[0] ||
    null;

  const awayResearch =
    selected?.awayRow
      ?.matchup_stats ||
    selected?.awayRow
      ?.team_stats ||
    {};

  const homeResearch =
    selected?.homeRow
      ?.matchup_stats ||
    selected?.homeRow
      ?.team_stats ||
    {};

  return (
    <section className="matchup-page">
      <div className="matchup-page-topbar">
        <div>
          <span className="product-page-eyebrow">
            RESEARCH CENTER
          </span>

          <h1>
            Matchup Breakdown
          </h1>

          <p>
            Compare the model,
            market, and football
            matchup before making
            your own betting
            decision.
          </p>
        </div>

        <label className="matchup-game-picker">
          <span>
            Select game
          </span>

          <select
            value={
              selected?.id ||
              ""
            }
            onChange={(
              event
            ) =>
              setSelectedGameId(
                event.target
                  .value
              )
            }
          >
            {games.length ===
              0 && (
              <option>
                No games loaded
              </option>
            )}

            {games.map(
              (game) => (
                <option
                  key={
                    game.id
                  }
                  value={
                    game.id
                  }
                >
                  {game.matchup}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {!selected ? (
        <section className="panel matchup-empty">
          <Swords size={32} />

          <h2>
            No matchup data loaded
          </h2>

          <p>
            Select a season and
            week with Bet Finder
            rows to populate this
            page.
          </p>
        </section>
      ) : (
        <>
          <section className="matchup-showdown">
            <div className="matchup-team matchup-team-away">
              <Helmet
                team={
                  selected.away
                }
                side="away"
              />

              <div className="matchup-team-copy">
                <span>
                  AWAY
                </span>

                <h2>
                  {selected.away}
                </h2>
              </div>
            </div>

            <div className="matchup-center">
              <span className="matchup-week">
                {season} · {week}
              </span>

              <strong className="matchup-vs">
                VS
              </strong>

              <span className="matchup-name">
                {selected.matchup}
              </span>

              <div className="matchup-live-badge">
                <Activity
                  size={13}
                />
                Live model data
              </div>
            </div>

            <div className="matchup-team matchup-team-home">
              <div className="matchup-team-copy">
                <span>
                  HOME
                </span>

                <h2>
                  {selected.home}
                </h2>
              </div>

              <Helmet
                team={
                  selected.home
                }
                side="home"
              />
            </div>
          </section>

          <section className="matchup-three-layers">
            <div className="matchup-layer model-layer">
              <span>
                🍌 BANANA
              </span>

              <strong>
                Model
              </strong>

              <small>
                What does the
                model think?
              </small>
            </div>

            <div className="matchup-layer research-layer">
              <span>
                📊 MATCHUP
              </span>

              <strong>
                Research
              </strong>

              <small>
                What does the
                football data say?
              </small>
            </div>

            <div className="matchup-layer market-layer">
              <span>
                💰 MARKET
              </span>

              <strong>
                Sportsbook
              </strong>

              <small>
                What price is the
                market offering?
              </small>
            </div>
          </section>

          <section className="panel matchup-market-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  LIVE MONEYLINE
                </span>

                <h2>
                  Model vs. Market
                </h2>
              </div>

              <InfoTooltip label="Model vs. Market">
                This section uses live
                Bet Finder values already
                returned by the Banana
                Bets API. It does not
                calculate new model
                probabilities in React.
              </InfoTooltip>
            </div>

            <div className="market-team-grid">
              <MarketTeamCard
                team={
                  selected.away
                }
                row={
                  selected.awayRow
                }
              />

              <div className="market-divider">
                <span>
                  VS
                </span>
              </div>

              <MarketTeamCard
                team={
                  selected.home
                }
                row={
                  selected.homeRow
                }
              />
            </div>

            <div className="matchup-market-summary">
              <div>
                <small>
                  Away EV
                </small>

                <strong
                  className={
                    Number(
                      selected
                        .awayRow
                        ?.ev
                    ) >= 0
                      ? "green-value"
                      : "red-value"
                  }
                >
                  {selected
                    .awayRow
                    ? signedPercent(
                        selected
                          .awayRow
                          .ev
                      )
                    : "—"}
                </strong>
              </div>

              <div>
                <small>
                  Away fair odds
                </small>

                <strong>
                  {selected
                    .awayRow
                    ? americanOdds(
                        selected
                          .awayRow
                          .fair_odds
                      )
                    : "—"}
                </strong>
              </div>

              <div>
                <small>
                  Home fair odds
                </small>

                <strong>
                  {selected
                    .homeRow
                    ? americanOdds(
                        selected
                          .homeRow
                          .fair_odds
                      )
                    : "—"}
                </strong>
              </div>

              <div>
                <small>
                  Home EV
                </small>

                <strong
                  className={
                    Number(
                      selected
                        .homeRow
                        ?.ev
                    ) >= 0
                      ? "green-value"
                      : "red-value"
                  }
                >
                  {selected
                    .homeRow
                    ? signedPercent(
                        selected
                          .homeRow
                          .ev
                      )
                    : "—"}
                </strong>
              </div>
            </div>
          </section>

          <div className="matchup-research-heading">
            <div>
              <span className="panel-kicker">
                FOOTBALL RESEARCH
              </span>

              <h2>
                Head-to-Head Team Metrics
              </h2>
            </div>

            <span className="research-pending-badge">
              Awaiting deeper team-stat
              fields from API
            </span>
          </div>

          <div className="matchup-research-grid">
            {STAT_GROUPS.map(
              (group) => (
                <ResearchGroup
                  key={
                    group.title
                  }
                  group={
                    group
                  }
                  awayData={
                    awayResearch
                  }
                  homeData={
                    homeResearch
                  }
                />
              )
            )}
          </div>

          <div className="matchup-bottom-grid">
            <section className="panel matchup-context-card">
              <div className="matchup-context-icon blue-context">
                <Shield
                  size={20}
                />
              </div>

              <div>
                <span className="panel-kicker">
                  PERSONNEL
                </span>

                <h3>
                  Injuries & Availability
                </h3>

                <p>
                  This panel is ready for
                  offensive-line injuries,
                  QB status, skill-player
                  availability, defensive
                  starters, and model
                  injury-impact fields.
                </p>

                <span className="data-coming">
                  Data connection pending
                </span>
              </div>
            </section>

            <section className="panel matchup-context-card">
              <div className="matchup-context-icon yellow-context">
                <CloudSun
                  size={20}
                />
              </div>

              <div>
                <span className="panel-kicker">
                  ENVIRONMENT
                </span>

                <h3>
                  Weather & Stadium
                </h3>

                <p>
                  Temperature, wind,
                  precipitation, surface,
                  roof status, and other
                  game-environment factors
                  will live here.
                </p>

                <span className="data-coming">
                  Data connection pending
                </span>
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
