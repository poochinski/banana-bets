import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Filter,
  LayoutGrid,
  List,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import InfoTooltip from "./InfoTooltip";

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : 0;
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

function valueLabel(row) {
  const ev =
    numberValue(row.ev);

  if (ev > 0) {
    return {
      label: "POSITIVE EV",
      tone: "positive",
      icon: TrendingUp
    };
  }

  if (ev < 0) {
    return {
      label: "NEGATIVE EV",
      tone: "negative",
      icon: TrendingDown
    };
  }

  return {
    label: "NEAR FAIR",
    tone: "neutral",
    icon: BarChart3
  };
}

function explanation(row) {
  const team =
    row.team || "This side";

  const model =
    percent(row.model_win_prob);

  const market =
    percent(row.market_win_prob);

  const edge =
    signedPoints(row.edge_vs_market);

  const ev =
    numberValue(row.ev);

  if (ev > 0) {
    return `${team} is priced lower by the market than Banana estimates. Banana has ${team} at ${model} versus ${market} implied by the listed price, a ${edge} difference.`;
  }

  if (ev < 0) {
    return `${team} may still be likely to win, but the listed price is expensive relative to Banana's estimate. The current price produces ${signedPercent(row.ev)} EV.`;
  }

  return `${team}'s listed price is close to Banana's fair-value estimate, so the model is not identifying much pricing advantage here.`;
}

function ProbabilityBars({ row }) {
  const model =
    Math.max(
      0,
      Math.min(
        100,
        numberValue(
          row.model_win_prob
        ) * 100
      )
    );

  const market =
    Math.max(
      0,
      Math.min(
        100,
        numberValue(
          row.market_win_prob
        ) * 100
      )
    );

  return (
    <div className="value-probability-bars">
      <div>
        <span>
          <strong>Banana</strong>
          <b>{model.toFixed(1)}%</b>
        </span>

        <div className="probability-track">
          <div
            className="probability-fill model-fill"
            style={{
              width: `${model}%`
            }}
          />
        </div>
      </div>

      <div>
        <span>
          <strong>Market</strong>
          <b>{market.toFixed(1)}%</b>
        </span>

        <div className="probability-track">
          <div
            className="probability-fill market-fill"
            style={{
              width: `${market}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ValueCard({
  row,
  onViewMatchup
}) {
  const value =
    valueLabel(row);

  const Icon =
    value.icon;

  return (
    <article
      className={`moneyline-value-card ${value.tone}`}
    >
      <div className="moneyline-value-card-top">
        <div>
          <span className={`value-status ${value.tone}`}>
            <Icon size={13} />
            {value.label}
          </span>

          <h3>
            {row.team} Moneyline{" "}
            <strong>
              {americanOdds(
                row.american_odds
              )}
            </strong>
          </h3>

          <p>
            {row.matchup}
          </p>
        </div>

        <div className="value-book">
          <span>
            LISTED BOOK
          </span>

          <strong>
            {displayBook(
              row.sportsbook
            )}
          </strong>
        </div>
      </div>

      <ProbabilityBars
        row={row}
      />

      <div className="value-card-metrics">
        <div>
          <span>
            Model edge
          </span>
          <strong className="green-value">
            {signedPoints(
              row.edge_vs_market
            )}
          </strong>
        </div>

        <div>
          <span>
            Expected value
          </span>
          <strong
            className={
              numberValue(
                row.ev
              ) >= 0
                ? "green-value"
                : "red-value"
            }
          >
            {signedPercent(
              row.ev
            )}
          </strong>
        </div>

        <div>
          <span>
            Banana fair odds
          </span>
          <strong>
            {americanOdds(
              row.fair_odds
            )}
          </strong>
        </div>

        <div>
          <span>
            Confidence
          </span>
          <strong>
            {String(
              row.confidence ||
              "—"
            ).toUpperCase()}
          </strong>
        </div>
      </div>

      <div className="value-card-explanation">
        <span>
          WHY IT MATTERS
        </span>

        <p>
          {explanation(row)}
        </p>
      </div>

      <div className="value-card-actions">
        <button
          type="button"
          className="value-matchup-button"
          onClick={() =>
            onViewMatchup(row)
          }
        >
          Research matchup
          <ArrowRight
            size={15}
          />
        </button>
      </div>
    </article>
  );
}

function AdvancedTable({
  rows
}) {
  return (
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
              Model Fair Odds{" "}
              <InfoTooltip label="Model Fair Odds">
                The sportsbook price implied by Banana's estimated probability before sportsbook margin.
              </InfoTooltip>
            </th>

            <th>
              Model{" "}
              <InfoTooltip label="Model Probability">
                Banana's estimated win probability for this team.
              </InfoTooltip>
            </th>

            <th>
              Market{" "}
              <InfoTooltip label="Market Probability">
                The win probability implied by the listed sportsbook price.
              </InfoTooltip>
            </th>

            <th>
              Edge (PP){" "}
              <InfoTooltip label="Model Edge">
                Banana probability minus market-implied probability, measured in percentage points.
              </InfoTooltip>
            </th>

            <th>
              EV{" "}
              <InfoTooltip label="Expected Value">
                Theoretical value of the listed price using Banana's estimated probability. Positive EV can still lose.
              </InfoTooltip>
            </th>

            <th>
              Conf.{" "}
              <InfoTooltip label="Confidence">
                Model confidence is separate from win probability.
              </InfoTooltip>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map(
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
                  <span className="team-badge">
                    {row.team}
                  </span>
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
                      numberValue(
                        row.edge_vs_market
                      ) >= 0
                        ? "edge-positive"
                        : "edge-negative"
                    }
                  >
                    {signedPoints(
                      row.edge_vs_market
                    )}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      numberValue(
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
                    className={`confidence-badge ${String(
                      row.confidence
                    ).toLowerCase()}`}
                  >
                    {row.confidence}
                  </span>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function MoneylineValueFinder({
  rows,
  loading,
  onViewMatchup
}) {
  const [view, setView] =
    useState("simple");

  const [sort, setSort] =
    useState("ev");

  const [sideType, setSideType] =
    useState("all");

  const [confidence, setConfidence] =
    useState("all");

  const [book, setBook] =
    useState("all");

  const [minEv, setMinEv] =
    useState("all");

  const books =
    useMemo(
      () =>
        Array.from(
          new Set(
            rows
              .map(
                (row) =>
                  row.sportsbook
              )
              .filter(Boolean)
          )
        ).sort(
          (a, b) =>
            displayBook(a)
              .localeCompare(
                displayBook(b)
              )
        ),
      [rows]
    );

  const filteredRows =
    useMemo(() => {
      let next =
        [...rows];

      if (
        sideType ===
        "underdog"
      ) {
        next = next.filter(
          (row) =>
            numberValue(
              row.american_odds
            ) > 0
        );
      }

      if (
        sideType ===
        "favorite"
      ) {
        next = next.filter(
          (row) =>
            numberValue(
              row.american_odds
            ) < 0
        );
      }

      if (
        confidence !== "all"
      ) {
        next = next.filter(
          (row) =>
            String(
              row.confidence
            ).toLowerCase() ===
            confidence
        );
      }

      if (book !== "all") {
        next = next.filter(
          (row) =>
            row.sportsbook ===
            book
        );
      }

      if (minEv !== "all") {
        const threshold =
          Number(minEv) /
          100;

        next = next.filter(
          (row) =>
            numberValue(
              row.ev
            ) >= threshold
        );
      }

      next.sort(
        (a, b) => {
          if (
            sort ===
            "edge"
          ) {
            return (
              numberValue(
                b.edge_vs_market
              ) -
              numberValue(
                a.edge_vs_market
              )
            );
          }

          if (
            sort ===
            "probability"
          ) {
            return (
              numberValue(
                b.model_win_prob
              ) -
              numberValue(
                a.model_win_prob
              )
            );
          }

          if (
            sort ===
            "odds"
          ) {
            return (
              numberValue(
                b.american_odds
              ) -
              numberValue(
                a.american_odds
              )
            );
          }

          return (
            numberValue(
              b.ev
            ) -
            numberValue(
              a.ev
            )
          );
        }
      );

      return next;
    }, [
      rows,
      sort,
      sideType,
      confidence,
      book,
      minEv
    ]);

  const lowCount =
    rows.filter(
      (row) =>
        String(
          row.confidence
        ).toUpperCase() ===
        "LOW"
    ).length;

  const allLow =
    rows.length > 0 &&
    lowCount === rows.length;

  return (
    <section
      className="panel moneyline-finder-v2"
      data-tour="bet-finder"
    >
      <div className="moneyline-finder-heading">
        <div>
          <span className="panel-kicker">
            MONEYLINE VALUE FINDER
          </span>

          <h2>
            Where does Banana disagree with the market?
          </h2>

          <p>
            Find teams where Banana's estimated win probability and fair price differ from the sportsbook price currently listed in the model data.
          </p>
        </div>

        <div className="finder-view-toggle">
          <button
            type="button"
            className={
              view === "simple"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("simple")
            }
          >
            <LayoutGrid size={15} />
            Simple View
          </button>

          <button
            type="button"
            className={
              view === "advanced"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("advanced")
            }
          >
            <List size={15} />
            Advanced Table
          </button>
        </div>
      </div>

      <div className="finder-how-to-read">
        <div>
          <BookOpen size={18} />
          <span>
            <strong>1. Compare probability.</strong>
            Is Banana higher or lower than the market?
          </span>
        </div>

        <div>
          <BarChart3 size={18} />
          <span>
            <strong>2. Check the price.</strong>
            Fair odds show what Banana thinks that probability is worth.
          </span>
        </div>

        <div>
          <TrendingUp size={18} />
          <span>
            <strong>3. Use EV as price context.</strong>
            Positive EV means the listed price is favorable under Banana's estimate.
          </span>
        </div>
      </div>

      {allLow && (
        <div className="finder-confidence-warning">
          <strong>
            Early-season model:
          </strong>{" "}
          every currently displayed moneyline has LOW model confidence. Treat the values as preliminary until the model has a larger current-season sample.
        </div>
      )}

      <div className="finder-book-note">
        <InfoTooltip label="Why does the same sportsbook appear multiple times?">
          Each row carries the sportsbook attached to that price in the API. The same book can legitimately appear for several teams. Banana Bets does not currently claim that this is the best price across every sportsbook unless the API explicitly provides that information.
        </InfoTooltip>

        <span>
          Sportsbooks can repeat because the finder evaluates each team/price independently.
        </span>
      </div>

      <div className="finder-controls">
        <div className="finder-controls-title">
          <SlidersHorizontal size={16} />
          Filter & sort
        </div>

        <label>
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value
              )
            }
          >
            <option value="ev">
              Highest EV
            </option>
            <option value="edge">
              Biggest edge
            </option>
            <option value="probability">
              Highest win probability
            </option>
            <option value="odds">
              Biggest underdog price
            </option>
          </select>
        </label>

        <label>
          <span>Side</span>
          <select
            value={sideType}
            onChange={(event) =>
              setSideType(
                event.target.value
              )
            }
          >
            <option value="all">
              All
            </option>
            <option value="underdog">
              Underdogs
            </option>
            <option value="favorite">
              Favorites
            </option>
          </select>
        </label>

        <label>
          <span>Confidence</span>
          <select
            value={confidence}
            onChange={(event) =>
              setConfidence(
                event.target.value
              )
            }
          >
            <option value="all">
              All
            </option>
            <option value="high">
              High
            </option>
            <option value="medium">
              Medium
            </option>
            <option value="low">
              Low
            </option>
          </select>
        </label>

        <label>
          <span>Sportsbook</span>
          <select
            value={book}
            onChange={(event) =>
              setBook(
                event.target.value
              )
            }
          >
            <option value="all">
              All books
            </option>

            {books.map(
              (bookKey) => (
                <option
                  key={bookKey}
                  value={bookKey}
                >
                  {displayBook(
                    bookKey
                  )}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span>Minimum EV</span>
          <select
            value={minEv}
            onChange={(event) =>
              setMinEv(
                event.target.value
              )
            }
          >
            <option value="all">
              Any
            </option>
            <option value="0">
              Positive only
            </option>
            <option value="3">
              3%+
            </option>
            <option value="5">
              5%+
            </option>
            <option value="10">
              10%+
            </option>
          </select>
        </label>
      </div>

      <div className="finder-result-count">
        <Filter size={14} />
        {filteredRows.length} of {rows.length} sides shown
      </div>

      {loading ? (
        <div className="loading-cell">
          Loading real Banana Bets model data...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="finder-empty">
          No moneylines match these filters.
        </div>
      ) : view === "simple" ? (
        <div className="moneyline-value-grid">
          {filteredRows.map(
            (row) => (
              <ValueCard
                key={`${row.game_id}-${row.team}`}
                row={row}
                onViewMatchup={
                  onViewMatchup
                }
              />
            )
          )}
        </div>
      ) : (
        <AdvancedTable
          rows={filteredRows}
        />
      )}
    </section>
  );
}
