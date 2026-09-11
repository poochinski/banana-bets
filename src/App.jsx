import React, {
  useEffect,
  useMemo,
  useState
} from "react";

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
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Pin
} from "lucide-react";

import {
  getApiHealth,
  getBetFinder
} from "./api";

import { NAV_ITEMS } from "./config/navigation";
import usePageRoute from "./hooks/usePageRoute";
import ProductPage from "./pages/ProductPage";
import SettingsPage from "./pages/SettingsPage";


const SNAPSHOT_OPTIONS = [
  {
    value: "auto",
    label: "Auto"
  },
  {
    value: "confidence",
    label: "Highest Confidence"
  },
  {
    value: "topEv",
    label: "Best EV"
  },
  {
    value: "edge",
    label: "Biggest Edge"
  },
  {
    value: "underdog",
    label: "Best Underdog"
  },
  {
    value: "favorite",
    label: "Best Favorite"
  }
];


/* =========================================================
   FORMATTERS
   ========================================================= */

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


function signedPercentagePoints(value, digits = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const formatted =
    (number * 100).toFixed(digits);

  return `${number >= 0 ? "+" : ""}${formatted} pp`;
}


function americanOdds(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const rounded =
    Math.round(number);

  return rounded > 0
    ? `+${rounded}`
    : String(rounded);
}


function displayBook(value) {
  if (!value) {
    return "Unknown book";
  }

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

  return (
    aliases[value] ||
    String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase()
      )
  );
}


function confidenceRank(value) {
  switch (
    String(value || "")
      .trim()
      .toUpperCase()
  ) {
    case "HIGH":
      return 3;

    case "MEDIUM":
      return 2;

    case "LOW":
      return 1;

    default:
      return 0;
  }
}


/* =========================================================
   SNAPSHOT RANKING
   ========================================================= */

function sortByEv(rows) {
  return [...rows].sort(
    (a, b) =>
      Number(b.ev || 0) -
      Number(a.ev || 0)
  );
}


function sortByEdge(rows) {
  return [...rows].sort(
    (a, b) =>
      Number(
        b.edge_vs_market || 0
      ) -
      Number(
        a.edge_vs_market || 0
      )
  );
}


function sortByConfidence(rows) {
  return [...rows].sort(
    (a, b) => {
      const confidenceDifference =
        confidenceRank(
          b.confidence
        ) -
        confidenceRank(
          a.confidence
        );

      if (
        confidenceDifference !== 0
      ) {
        return confidenceDifference;
      }

      return (
        Number(b.ev || 0) -
        Number(a.ev || 0)
      );
    }
  );
}


function rowsForSnapshotKind(
  kind,
  rows
) {
  switch (kind) {
    case "confidence":
      return sortByConfidence(
        rows
      );

    case "topEv":
      return sortByEv(
        rows
      );

    case "edge":
      return sortByEdge(
        rows
      );

    case "underdog":
      return sortByEv(
        rows.filter(
          (row) =>
            Number(
              row.american_odds
            ) > 0
        )
      );

    case "favorite":
      return sortByEv(
        rows.filter(
          (row) =>
            Number(
              row.american_odds
            ) < 0
        )
      );

    default:
      return sortByEv(
        rows
      );
  }
}


function findCandidate(
  kind,
  rows,
  excludedGames = new Set()
) {
  const ranked =
    rowsForSnapshotKind(
      kind,
      rows
    );

  return (
    ranked.find(
      (row) =>
        !excludedGames.has(
          row.game_id
        )
    ) ||
    null
  );
}


function buildGlobalAutoPool(
  rows,
  excludedGames,
  count
) {
  const results = [];

  const usedGames =
    new Set(excludedGames);

  function addCandidate(
    kind,
    candidateRows = rows
  ) {
    if (
      results.length >= count
    ) {
      return;
    }

    const candidate =
      findCandidate(
        kind,
        candidateRows,
        usedGames
      );

    if (!candidate) {
      return;
    }

    results.push({
      kind,
      row: candidate
    });

    usedGames.add(
      candidate.game_id
    );
  }


  /*
   * If ANY real HIGH-confidence model output exists,
   * it gets first priority in AUTO mode.
   *
   * We choose the highest-EV HIGH-confidence row.
   */
  const highConfidence =
    rows.filter(
      (row) =>
        confidenceRank(
          row.confidence
        ) === 3
    );

  if (
    highConfidence.length > 0
  ) {
    addCandidate(
      "confidence",
      highConfidence
    );
  }


  /*
   * Then build a diverse group of useful signals.
   */
  addCandidate(
    "topEv"
  );

  addCandidate(
    "edge"
  );

  addCandidate(
    "underdog"
  );

  addCandidate(
    "favorite"
  );


  /*
   * If duplicate games prevented us from
   * reaching four cards, fill remaining
   * positions using the next best EV games.
   */
  const evRows =
    sortByEv(rows);

  for (
    const row of evRows
  ) {
    if (
      results.length >= count
    ) {
      break;
    }

    if (
      usedGames.has(
        row.game_id
      )
    ) {
      continue;
    }

    results.push({
      kind: "topEv",
      row
    });

    usedGames.add(
      row.game_id
    );
  }

  return results;
}


function buildGlobalModePool(
  rows,
  mode,
  excludedGames,
  count
) {
  if (
    mode === "auto"
  ) {
    return buildGlobalAutoPool(
      rows,
      excludedGames,
      count
    );
  }

  const ranked =
    rowsForSnapshotKind(
      mode,
      rows
    );

  const results = [];

  const usedGames =
    new Set(excludedGames);

  for (
    const row of ranked
  ) {
    if (
      results.length >= count
    ) {
      break;
    }

    if (
      usedGames.has(
        row.game_id
      )
    ) {
      continue;
    }

    results.push({
      kind: mode,
      row
    });

    usedGames.add(
      row.game_id
    );
  }

  return results;
}


function buildSnapshotSlots({
  rows,
  globalMode,
  slotModes,
  pinnedSlots
}) {
  const slots =
    Array(4).fill(null);

  const usedGames =
    new Set();


  /*
   * 1. Resolve pinned cards first.
   *
   * Pin stores the actual game/team identity,
   * but values still refresh from current API data.
   */
  pinnedSlots.forEach(
    (pin, index) => {
      if (!pin) {
        return;
      }

      const row =
        rows.find(
          (candidate) =>
            candidate.game_id ===
              pin.game_id &&
            candidate.team ===
              pin.team
        );

      if (!row) {
        return;
      }

      slots[index] = {
        kind: pin.kind,
        row,
        pinned: true
      };

      usedGames.add(
        row.game_id
      );
    }
  );


  /*
   * 2. Resolve individual manual card modes.
   */
  slotModes.forEach(
    (mode, index) => {
      if (
        slots[index] ||
        mode === "auto"
      ) {
        return;
      }

      let candidate =
        findCandidate(
          mode,
          rows,
          usedGames
        );

      /*
       * If every candidate from that category
       * is already represented, still honor the
       * user's manual choice.
       */
      if (!candidate) {
        candidate =
          findCandidate(
            mode,
            rows,
            new Set()
          );
      }

      if (!candidate) {
        return;
      }

      slots[index] = {
        kind: mode,
        row: candidate,
        pinned: false
      };

      usedGames.add(
        candidate.game_id
      );
    }
  );


  /*
   * 3. AUTO/global-mode fills the remaining slots.
   */
  const remaining =
    slots.filter(
      (slot) => !slot
    ).length;

  const autoPool =
    buildGlobalModePool(
      rows,
      globalMode,
      usedGames,
      remaining
    );

  let poolIndex = 0;

  for (
    let index = 0;
    index < slots.length;
    index++
  ) {
    if (slots[index]) {
      continue;
    }

    const candidate =
      autoPool[
        poolIndex
      ];

    poolIndex += 1;

    if (!candidate) {
      continue;
    }

    slots[index] = {
      ...candidate,
      pinned: false
    };
  }

  return slots;
}


/* =========================================================
   SHARED UI
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
      <aside
        className={`sidebar ${
          mobileOpen
            ? "open"
            : ""
        }`}
      >
        <button
          className="sidebar-close"
          onClick={() =>
            setMobileOpen(false)
          }
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
              BANANA{" "}
              <strong>
                BETS
              </strong>
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
          {NAV_ITEMS.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <button
                  key={
                    item.name
                  }
                  className={`nav-button ${
                    activePage ===
                    item.name
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setActivePage(
                      item.name
                    );

                    setMobileOpen(
                      false
                    );
                  }}
                >
                  <Icon
                    size={18}
                  />

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
            }
          )}
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
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}
    </>
  );
}


/* =========================================================
   TOPBAR
   ========================================================= */

function Topbar({
  season,
  setSeason,
  week,
  setWeek,
  setMobileOpen,
  apiState,
  onRefresh,
  lastUpdated
}) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() =>
          setMobileOpen(true)
        }
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
          BANANA{" "}
          <strong>
            BETS
          </strong>
        </span>
      </div>

      <div className="selector">
        <label>
          Season
        </label>

        <div className="select-shell">
          <select
            value={season}
            onChange={(event) =>
              setSeason(
                event.target.value
              )
            }
          >
            <option>
              2026
            </option>

            <option>
              2025
            </option>

            <option>
              2024
            </option>
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
            onChange={(event) =>
              setWeek(
                event.target.value
              )
            }
          >
            {Array.from(
              { length: 18 },
              (_, index) => (
                <option
                  key={
                    index + 1
                  }
                >
                  Week {index + 1}
                </option>
              )
            )}
          </select>

          <ChevronDown size={14} />
        </div>
      </div>

      <button
        className={`api-status ${
          apiState
        }`}
        onClick={
          onRefresh
        }
        title="Refresh model data"
      >
        {apiState ===
        "connected" ? (
          <Wifi size={15} />
        ) : apiState ===
          "loading" ? (
          <RefreshCw
            size={15}
            className="spin"
          />
        ) : (
          <WifiOff size={15} />
        )}

        <div className="api-status-copy">
          <span>
            {apiState ===
            "connected"
              ? "MODEL LIVE"
              : apiState ===
                "loading"
                ? "LOADING"
                : "OFFLINE"}
          </span>

          {lastUpdated &&
            apiState ===
              "connected" && (
              <small>
                Updated{" "}
                {lastUpdated.toLocaleTimeString(
                  [],
                  {
                    hour:
                      "numeric",
                    minute:
                      "2-digit"
                  }
                )}
              </small>
            )}
        </div>
      </button>

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
   SNAPSHOT CARD CONTENT
   ========================================================= */

function snapshotCardDetails(
  candidate
) {
  if (
    !candidate ||
    !candidate.row
  ) {
    return {
      label:
        "SNAPSHOT",
      title:
        "NO DATA",
      primary:
        "—",
      secondary:
        "No result available",
      meta:
        "",
      accent:
        "highlight-gray",
      icon:
        <Activity size={18} />
    };
  }

  const {
    kind,
    row
  } = candidate;

  const teamTitle =
    `${row.team} MONEYLINE`;

  switch (kind) {
    case "confidence":
      return {
        label:
          "HIGHEST CONFIDENCE",
        title:
          teamTitle,
        primary:
          String(
            row.confidence ||
            "—"
          ).toUpperCase(),
        secondary:
          `${signedPercent(
            row.ev
          )} EV · Model ${percent(
            row.model_win_prob
          )}`,
        meta:
          `${americanOdds(
            row.american_odds
          )} · ${displayBook(
            row.sportsbook
          )}`,
        accent:
          confidenceRank(
            row.confidence
          ) === 3
            ? "highlight-green"
            : confidenceRank(
                row.confidence
              ) === 2
              ? "highlight-blue"
              : "highlight-gray",
        icon:
          <ShieldCheck size={18} />
      };

    case "edge":
      return {
        label:
          "MODEL / MARKET EDGE",
        title:
          teamTitle,
        primary:
          signedPercentagePoints(
            row.edge_vs_market
          ),
        secondary:
          `Model ${percent(
            row.model_win_prob
          )} · Market ${percent(
            row.market_win_prob
          )}`,
        meta:
          `${americanOdds(
            row.american_odds
          )} · ${displayBook(
            row.sportsbook
          )}`,
        accent:
          "highlight-blue",
        icon:
          <BarChart3 size={18} />
      };

    case "underdog":
      return {
        label:
          "UNDERDOG VALUE",
        title:
          teamTitle,
        primary:
          americanOdds(
            row.american_odds
          ),
        secondary:
          `${signedPercent(
            row.ev
          )} EV · Fair ${americanOdds(
            row.fair_odds
          )}`,
        meta:
          `${row.matchup} · ${displayBook(
            row.sportsbook
          )}`,
        accent:
          "highlight-green",
        icon:
          <TrendingUp size={18} />
      };

    case "favorite":
      return {
        label:
          "FAVORITE VALUE",
        title:
          teamTitle,
        primary:
          americanOdds(
            row.american_odds
          ),
        secondary:
          `${signedPercent(
            row.ev
          )} EV · Fair ${americanOdds(
            row.fair_odds
          )}`,
        meta:
          `${row.matchup} · ${displayBook(
            row.sportsbook
          )}`,
        accent:
          "highlight-gray",
        icon:
          <Target size={18} />
      };

    case "topEv":
    default:
      return {
        label:
          "TOP MONEYLINE EV",
        title:
          teamTitle,
        primary:
          `${signedPercent(
            row.ev
          )} EV`,
        secondary:
          `Model ${percent(
            row.model_win_prob
          )} · Market ${percent(
            row.market_win_prob
          )}`,
        meta:
          `${americanOdds(
            row.american_odds
          )} · ${displayBook(
            row.sportsbook
          )}`,
        accent:
          "highlight-yellow",
        icon:
          <Trophy size={18} />
      };
  }
}


/* =========================================================
   SNAPSHOT CARD
   ========================================================= */

function SnapshotCard({
  candidate,
  index,
  slotMode,
  setSlotMode,
  pinned,
  onTogglePin
}) {
  const details =
    snapshotCardDetails(
      candidate
    );

  return (
    <div
      className={`highlight-card ${
        details.accent
      } ${
        pinned
          ? "pinned"
          : ""
      }`}
    >
      <div className="highlight-card-header">
        <div className="highlight-card-label-group">
          <span className="highlight-icon">
            {details.icon}
          </span>

          <span className="highlight-label">
            {details.label}
          </span>
        </div>

        <div className="card-controls">
          <select
            value={slotMode}
            disabled={pinned}
            onChange={(event) =>
              setSlotMode(
                index,
                event.target.value
              )
            }
            aria-label={`Snapshot card ${
              index + 1
            } mode`}
          >
            {SNAPSHOT_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <button
            className={`pin-button ${
              pinned
                ? "active"
                : ""
            }`}
            onClick={() =>
              onTogglePin(
                index,
                candidate
              )
            }
            disabled={
              !candidate
            }
            title={
              pinned
                ? "Unpin this card"
                : "Pin this bet"
            }
            aria-label={
              pinned
                ? "Unpin this snapshot card"
                : "Pin this snapshot card"
            }
          >
            <Pin
              size={13}
              fill={
                pinned
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>

      {pinned && (
        <div className="pinned-label">
          PINNED
        </div>
      )}

      <div className="highlight-title">
        {details.title}
      </div>

      <div className="highlight-primary">
        {details.primary}
      </div>

      <div className="highlight-secondary">
        {details.secondary}
      </div>

      <div className="highlight-meta">
        {details.meta}
      </div>
    </div>
  );
}


/* =========================================================
   HERO / DYNAMIC SNAPSHOT
   ========================================================= */

function Hero({
  rows,
  season,
  week,
  loading,
  error,
  snapshotMode,
  setSnapshotMode,
  slotModes,
  setSlotModes,
  pinnedSlots,
  setPinnedSlots
}) {
  const uniqueGames =
    new Set(
      rows.map(
        (row) =>
          row.game_id
      )
    ).size;

  const qualified =
    rows.filter(
      (row) =>
        row.meets_threshold ===
        true
    );

  const highConfidenceCount =
    rows.filter(
      (row) =>
        confidenceRank(
          row.confidence
        ) === 3
    ).length;

  const snapshotSlots =
    useMemo(
      () =>
        buildSnapshotSlots({
          rows,
          globalMode:
            snapshotMode,
          slotModes,
          pinnedSlots
        }),
      [
        rows,
        snapshotMode,
        slotModes,
        pinnedSlots
      ]
    );


  function setSlotMode(
    index,
    mode
  ) {
    setSlotModes(
      (current) => {
        const next =
          [...current];

        next[index] =
          mode;

        return next;
      }
    );

    /*
     * Changing a card's mode also
     * releases its specific pin.
     */
    setPinnedSlots(
      (current) => {
        const next =
          [...current];

        next[index] =
          null;

        return next;
      }
    );
  }


  function togglePin(
    index,
    candidate
  ) {
    setPinnedSlots(
      (current) => {
        const next =
          [...current];

        if (
          next[index]
        ) {
          next[index] =
            null;

          return next;
        }

        if (
          !candidate ||
          !candidate.row
        ) {
          return next;
        }

        next[index] = {
          game_id:
            candidate.row
              .game_id,

          team:
            candidate.row
              .team,

          kind:
            candidate.kind
        };

        return next;
      }
    );
  }


  return (
    <section className="hero">
      <div className="hero-heading-row">
        <div>
          <div className="eyebrow">
            WEEKLY COMMAND CENTER
          </div>

          <h1>
            {week.toUpperCase()} SNAPSHOT
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

        <div className="hero-right-controls">
          <div className="snapshot-mode-control">
            <label>
              SNAPSHOT VIEW
            </label>

            <div className="snapshot-select-shell">
              <select
                value={
                  snapshotMode
                }
                onChange={(event) =>
                  setSnapshotMode(
                    event.target
                      .value
                  )
                }
              >
                {SNAPSHOT_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                size={13}
              />
            </div>

            <small>
              Auto updates with model data
            </small>
          </div>

          <div className="hero-week-status">
            <span>
              {season} REGULAR SEASON
            </span>

            <strong>
              {uniqueGames} GAMES
            </strong>

            <div>
              {rows.length} MONEYLINE SIDES
            </div>

            <small>
              {qualified.length} meet EV threshold
            </small>
          </div>
        </div>
      </div>

      {highConfidenceCount >
        0 &&
        snapshotMode ===
          "auto" && (
          <div className="high-confidence-notice">
            <ShieldCheck
              size={14}
            />

            <span>
              {highConfidenceCount} HIGH-confidence{" "}
              {highConfidenceCount ===
              1
                ? "result is"
                : "results are"}{" "}
              available. AUTO prioritizes at least one.
            </span>
          </div>
        )}

      {error && (
        <div className="api-error-banner">
          <AlertTriangle
            size={17}
          />

          <span>
            {error}
          </span>
        </div>
      )}

      <div className="hero-highlight-grid">
        {loading ? (
          Array.from({
            length: 4
          }).map(
            (_, index) => (
              <div
                className="highlight-card highlight-gray loading-snapshot"
                key={index}
              >
                <RefreshCw
                  size={18}
                  className="spin"
                />

                <strong>
                  Loading model...
                </strong>
              </div>
            )
          )
        ) : (
          snapshotSlots.map(
            (
              candidate,
              index
            ) => (
              <SnapshotCard
                key={index}
                candidate={
                  candidate
                }
                index={
                  index
                }
                slotMode={
                  slotModes[
                    index
                  ]
                }
                setSlotMode={
                  setSlotMode
                }
                pinned={
                  Boolean(
                    pinnedSlots[
                      index
                    ]
                  )
                }
                onTogglePin={
                  togglePin
                }
              />
            )
          )
        )}
      </div>

      <div className="snapshot-help">
        <span>
          <strong>AUTO</strong>{" "}
          selects the strongest useful,
          non-duplicate signals.
        </span>

        <span>
          Use a card menu to override one
          slot, or pin a bet to keep it
          visible while its live values
          continue updating.
        </span>
      </div>
    </section>
  );
}


/* =========================================================
   SUMMARY METRICS
   ========================================================= */

function MetricCard({
  icon,
  value,
  label,
  accent
}) {
  return (
    <div
      className={`metric-card ${
        accent
      }`}
    >
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


function Metrics({
  rows
}) {
  const positiveEv =
    rows.filter(
      (row) =>
        Number(
          row.ev
        ) > 0
    );

  const threshold =
    rows.filter(
      (row) =>
        row.meets_threshold ===
        true
    );

  const bestEv =
    rows.length
      ? Math.max(
          ...rows.map(
            (row) =>
              Number(
                row.ev
              )
          )
        )
      : null;

  const uniqueGames =
    new Set(
      rows.map(
        (row) =>
          row.game_id
      )
    ).size;

  const highConfidence =
    rows.filter(
      (row) =>
        confidenceRank(
          row.confidence
        ) === 3
    ).length;

  return (
    <section className="metrics">
      <MetricCard
        icon={
          <TrendingUp
            size={24}
          />
        }
        value={
          bestEv !== null
            ? signedPercent(
                bestEv
              )
            : "—"
        }
        label="Best EV"
        accent="green-accent"
      />

      <MetricCard
        icon={
          <Target
            size={24}
          />
        }
        value={
          threshold.length
        }
        label="Threshold Plays"
        accent="yellow-accent"
      />

      <MetricCard
        icon={
          <Database
            size={24}
          />
        }
        value={
          uniqueGames
        }
        label="Games Loaded"
        accent="blue-accent"
      />

      <MetricCard
        icon={
          <Activity
            size={24}
          />
        }
        value={
          positiveEv.length
        }
        label="Positive EV Sides"
        accent="gray-accent"
      />

      <MetricCard
        icon={
          <ShieldCheck
            size={24}
          />
        }
        value={
          highConfidence
        }
        label="High Confidence"
        accent="red-accent"
      />
    </section>
  );
}


/* =========================================================
   BET FINDER TABLE
   ========================================================= */

function PredictionsTable({
  rows,
  loading
}) {
  return (
    <section className="panel predictions-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">
            LIVE FROM 03_BET_FINDER
          </span>

          <h2>
            Moneyline Bet Finder
          </h2>
        </div>

        <span className="record-count">
          {rows.length} sides
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                Matchup
              </th>

              <th>
                Team
              </th>

              <th>
                Book
              </th>

              <th>
                Odds
              </th>

              <th>
                Fair
              </th>

              <th>
                Model
              </th>

              <th>
                Market
              </th>

              <th>
                Edge (PP)
              </th>

              <th>
                EV
              </th>

              <th>
                Conf.
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="10"
                  className="loading-cell"
                >
                  Loading real Banana Bets model data...
                </td>
              </tr>
            ) : rows.length ===
              0 ? (
              <tr>
                <td
                  colSpan="10"
                  className="loading-cell"
                >
                  No Bet Finder rows were returned for this season and week.
                </td>
              </tr>
            ) : (
              rows.map(
                (row) => (
                  <tr
                    key={`${row.game_id}-${row.team}`}
                    className={
                      row.meets_threshold
                        ? "threshold-row"
                        : ""
                    }
                  >
                    <td>
                      <strong>
                        {row.matchup}
                      </strong>
                    </td>

                    <td>
                      <TeamBadge
                        team={
                          row.team
                        }
                      />
                    </td>

                    <td className="book-cell">
                      {displayBook(
                        row.sportsbook
                      )}
                    </td>

                    <td className="odds-cell">
                      {americanOdds(
                        row.american_odds
                      )}
                    </td>

                    <td>
                      {americanOdds(
                        row.fair_odds
                      )}
                    </td>

                    <td>
                      <span className="probability-pill">
                        {percent(
                          row.model_win_prob
                        )}
                      </span>
                    </td>

                    <td>
                      {percent(
                        row.market_win_prob
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          Number(
                            row.edge_vs_market
                          ) >= 0
                            ? "edge-positive"
                            : "edge-negative"
                        }
                      >
                        {signedPercentagePoints(
                          row.edge_vs_market
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          Number(
                            row.ev
                          ) >= 0
                            ? "ev-positive"
                            : "ev-negative"
                        }
                      >
                        {signedPercent(
                          row.ev
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`confidence-badge ${
                          String(
                            row.confidence
                          ).toLowerCase()
                        }`}
                      >
                        {row.confidence}
                      </span>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


/* =========================================================
   MODEL STATUS
   ========================================================= */

function ModelStatus({
  rows
}) {
  const gamesUsed =
    rows.length
      ? Math.min(
          ...rows.map(
            (row) =>
              Number(
                row.games_used ||
                0
              )
          )
        )
      : 0;

  const confidenceValues =
    rows.reduce(
      (
        result,
        row
      ) => {
        const key =
          String(
            row.confidence ||
            "UNKNOWN"
          ).toUpperCase();

        result[key] =
          (
            result[key] ||
            0
          ) + 1;

        return result;
      },
      {}
    );

  return (
    <section className="panel">
      <span className="panel-kicker">
        CURRENT MODEL STATE
      </span>

      <h3>
        Confidence
      </h3>

      <div className="current-confidence">
        <strong>
          {gamesUsed}
        </strong>

        <span>
          current-season games used
        </span>
      </div>

      <div className="confidence-summary">
        <div>
          <span>
            LOW
          </span>

          <strong>
            {confidenceValues.LOW ||
              0}
          </strong>
        </div>

        <div>
          <span>
            MEDIUM
          </span>

          <strong>
            {confidenceValues.MEDIUM ||
              0}
          </strong>
        </div>

        <div>
          <span>
            HIGH
          </span>

          <strong>
            {confidenceValues.HIGH ||
              0}
          </strong>
        </div>
      </div>

      {gamesUsed ===
        0 &&
        rows.length >
          0 && (
          <div className="season-warning">
            Week 1 currently contains no
            current-season game sample.
            Confidence is intentionally
            low.
          </div>
        )}
    </section>
  );
}


/* =========================================================
   TOP VALUES
   ========================================================= */

function TopValues({
  rows
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">
            MONEYLINE
          </span>

          <h3>
            Top Model Values
          </h3>
        </div>
      </div>

      <div className="top-values-list">
        {sortByEv(rows)
          .slice(
            0,
            6
          )
          .map(
            (
              row,
              index
            ) => (
              <div
                className="top-value-row"
                key={`${row.game_id}-${row.team}`}
              >
                <span className="value-rank">
                  {index + 1}
                </span>

                <div>
                  <strong>
                    {row.team} ML
                  </strong>

                  <span>
                    {row.matchup}
                  </span>
                </div>

                <div className="value-price">
                  <strong>
                    {americanOdds(
                      row.american_odds
                    )}
                  </strong>

                  <span>
                    {signedPercent(
                      row.ev
                    )}{" "}
                    EV
                  </span>
                </div>
              </div>
            )
          )}
      </div>
    </section>
  );
}


/* =========================================================
   DATA SOURCE
   ========================================================= */

function DataSourceCard({
  health,
  lastUpdated
}) {
  return (
    <section className="panel data-source-card">
      <div className="data-source-icon">
        <Database
          size={26}
        />
      </div>

      <div>
        <span className="panel-kicker">
          DATA CONNECTION
        </span>

        <h3>
          Google Sheets
        </h3>

        <p>
          {health
            ? `${health.spreadsheet} · ${
                health
                  .bet_finder_sheet
                  ?.rows ??
                0
              } Bet Finder rows`
            : "Banana Bets Apps Script API"}
        </p>

        {lastUpdated && (
          <small>
            Last loaded{" "}
            {lastUpdated.toLocaleTimeString(
              [],
              {
                hour:
                  "numeric",
                minute:
                  "2-digit"
              }
            )}
          </small>
        )}
      </div>
    </section>
  );
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  rows,
  loading,
  error,
  health,
  season,
  week,
  lastUpdated,
  snapshotMode,
  setSnapshotMode,
  slotModes,
  setSlotModes,
  pinnedSlots,
  setPinnedSlots
}) {
  return (
    <>
      <Hero
        rows={
          rows
        }
        season={
          season
        }
        week={
          week
        }
        loading={
          loading
        }
        error={
          error
        }
        snapshotMode={
          snapshotMode
        }
        setSnapshotMode={
          setSnapshotMode
        }
        slotModes={
          slotModes
        }
        setSlotModes={
          setSlotModes
        }
        pinnedSlots={
          pinnedSlots
        }
        setPinnedSlots={
          setPinnedSlots
        }
      />

      <Metrics
        rows={
          rows
        }
      />

      <div className="main-dashboard">
        <PredictionsTable
          rows={
            rows
          }
          loading={
            loading
          }
        />

        <aside className="right-dashboard">
          <ModelStatus
            rows={
              rows
            }
          />

          <TopValues
            rows={
              rows
            }
          />

          <DataSourceCard
            health={
              health
            }
            lastUpdated={
              lastUpdated
            }
          />
        </aside>
      </div>
    </>
  );
}


/* =========================================================
   PLACEHOLDER PAGES
   ========================================================= */

function Placeholder({
  page
}) {
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
        This section has not been
        connected yet. The dashboard is
        currently using the live Banana
        Bets model API.
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
  ] = usePageRoute("Dashboard");

  const [
    mobileOpen,
    setMobileOpen
  ] =
    useState(false);

  const [
    season,
    setSeason
  ] =
    useState("2026");

  const [
    week,
    setWeek
  ] =
    useState(
      "Week 1"
    );

  const [
    rows,
    setRows
  ] =
    useState([]);

  const [
    health,
    setHealth
  ] =
    useState(null);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    error,
    setError
  ] =
    useState(null);

  const [
    apiState,
    setApiState
  ] =
    useState(
      "loading"
    );

  const [
    refreshKey,
    setRefreshKey
  ] =
    useState(0);

  const [
    lastUpdated,
    setLastUpdated
  ] =
    useState(null);


  /*
   * SNAPSHOT CONTROLS
   */
  const [
    snapshotMode,
    setSnapshotMode
  ] =
    useState("auto");

  const [
    slotModes,
    setSlotModes
  ] =
    useState([
      "auto",
      "auto",
      "auto",
      "auto"
    ]);

  const [
    pinnedSlots,
    setPinnedSlots
  ] =
    useState([
      null,
      null,
      null,
      null
    ]);


  const weekNumber =
    useMemo(
      () => {
        const match =
          week.match(
            /\d+/
          );

        return match
          ? Number(
              match[0]
            )
          : 1;
      },
      [
        week
      ]
    );


  /*
   * A pin refers to a specific game/team.
   * Clear pins when the user switches weeks
   * or seasons so stale bets cannot remain.
   */
  useEffect(
    () => {
      setPinnedSlots([
        null,
        null,
        null,
        null
      ]);
    },
    [
      season,
      weekNumber
    ]
  );


  useEffect(
    () => {
      let cancelled =
        false;

      async function loadData() {
        setLoading(
          true
        );

        setError(
          null
        );

        setApiState(
          "loading"
        );

        try {
          const [
            healthResponse,
            betsResponse
          ] =
            await Promise.all([
              getApiHealth(),

              getBetFinder({
                season:
                  Number(
                    season
                  ),

                week:
                  weekNumber,

                market:
                  "moneyline",

                limit:
                  500
              })
            ]);

          if (
            cancelled
          ) {
            return;
          }

          setHealth(
            healthResponse
          );

          setRows(
            Array.isArray(
              betsResponse.rows
            )
              ? betsResponse.rows
              : []
          );

          setApiState(
            "connected"
          );

          setLastUpdated(
            new Date()
          );
        } catch (
          loadError
        ) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "Banana Bets API error:",
            loadError
          );

          setRows([]);

          setApiState(
            "offline"
          );

          setError(
            loadError.message ||
            "Could not load model data."
          );
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      }

      loadData();

      return () => {
        cancelled =
          true;
      };
    },
    [
      season,
      weekNumber,
      refreshKey
    ]
  );


  function refreshModel() {
    setRefreshKey(
      (current) =>
        current + 1
    );
  }


  return (
    <div className="app">
      <Sidebar
        activePage={
          activePage
        }
        setActivePage={
          setActivePage
        }
        mobileOpen={
          mobileOpen
        }
        setMobileOpen={
          setMobileOpen
        }
      />

      <div className="site">
        <Topbar
          season={
            season
          }
          setSeason={
            setSeason
          }
          week={
            week
          }
          setWeek={
            setWeek
          }
          setMobileOpen={
            setMobileOpen
          }
          apiState={
            apiState
          }
          onRefresh={
            refreshModel
          }
          lastUpdated={
            lastUpdated
          }
        />

        <main className="content">
          {activePage ===
          "Dashboard" ? (
            <Dashboard
              rows={
                rows
              }
              loading={
                loading
              }
              error={
                error
              }
              health={
                health
              }
              season={
                season
              }
              week={
                week
              }
              lastUpdated={
                lastUpdated
              }
              snapshotMode={
                snapshotMode
              }
              setSnapshotMode={
                setSnapshotMode
              }
              slotModes={
                slotModes
              }
              setSlotModes={
                setSlotModes
              }
              pinnedSlots={
                pinnedSlots
              }
              setPinnedSlots={
                setPinnedSlots
              }
            />
          ) : activePage ===
            "Settings" ? (
            <SettingsPage />
          ) : (
            <ProductPage
              page={
                activePage
              }
            />
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
            Google Sheets
            <span>•</span>
            Apps Script
            <span>•</span>
            React
          </div>
        </footer>
      </div>
    </div>
  );
}