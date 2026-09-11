import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Layers3,
  ShieldAlert,
  Trash2,
  X
} from "lucide-react";

function americanOdds(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const rounded =
    Math.round(number);

  return rounded > 0
    ? `+${rounded}`
    : String(rounded);
}

function percent(value, digits = 1) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${(
    number * 100
  ).toFixed(digits)}%`;
}

function signedPercent(
  value,
  digits = 1
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const formatted =
    (
      number * 100
    ).toFixed(digits);

  return `${
    number >= 0
      ? "+"
      : ""
  }${formatted}%`;
}

function signedPoints(
  value,
  digits = 1
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const formatted =
    (
      number * 100
    ).toFixed(digits);

  return `${
    number >= 0
      ? "+"
      : ""
  }${formatted} pp`;
}

function displayBook(value) {
  if (!value) {
    return "Unknown book";
  }

  const aliases = {
    williamhill:
      "William Hill",
    fanduel:
      "FanDuel",
    draftkings:
      "DraftKings",
    matchbook:
      "Matchbook",
    marathonbet:
      "Marathonbet",
    betfair_ex_eu:
      "Betfair Exchange",
    unibet_se:
      "Unibet",
    unibet_nl:
      "Unibet"
  };

  return (
    aliases[value] ||
    String(value)
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase()
      )
  );
}

function warningList(legs) {
  const warnings = [];

  const low =
    legs.filter(
      (leg) =>
        leg.confidence ===
        "LOW"
    );

  if (low.length > 0) {
    warnings.push({
      icon: ShieldAlert,
      title:
        "Low-confidence legs",
      text:
        `${low.length} of ${legs.length} selected legs currently carry LOW model confidence.`
    });
  }

  const negative =
    legs.filter(
      (leg) =>
        Number(
          leg.ev
        ) < 0
    );

  if (
    negative.length > 0
  ) {
    warnings.push({
      icon:
        AlertTriangle,
      title:
        "Negative-EV leg",
      text:
        `${negative
          .map(
            (leg) =>
              `${leg.team} ${americanOdds(
                leg.odds
              )}`
          )
          .join(
            ", "
          )} currently price worse than Banana's estimate.`
    });
  }

  const gameMap =
    legs.reduce(
      (result, leg) => {
        const key =
          leg.gameId ||
          leg.matchup;

        if (!key) {
          return result;
        }

        result[key] =
          [
            ...(
              result[key] ||
              []
            ),
            leg
          ];

        return result;
      },
      {}
    );

  Object.values(
    gameMap
  ).forEach(
    (gameLegs) => {
      if (
        gameLegs.length >
        1
      ) {
        warnings.push({
          icon:
            Layers3,
          title:
            "Same-game legs",
          text:
            "Multiple legs come from the same game. V1 does not calculate correlation-aware combined probability."
        });
      }
    }
  );

  return warnings;
}

function LegCard({
  leg,
  onRemove,
  onResearch
}) {
  return (
    <article className="builder-leg-card">
      <div className="builder-leg-main">
        <div>
          <span className="builder-source">
            {leg.sourceLabel ||
              "Banana API"}
          </span>

          <h3>
            {leg.team}{" "}
            {leg.market ===
            "moneyline"
              ? "Moneyline"
              : leg.market}
          </h3>

          <p>
            {leg.matchup}
          </p>
        </div>

        <div className="builder-price">
          <strong>
            {americanOdds(
              leg.odds
            )}
          </strong>

          <span>
            {displayBook(
              leg.sportsbook
            )}
          </span>
        </div>
      </div>

      <div className="builder-leg-metrics">
        <div>
          <span>
            Banana
          </span>

          <strong>
            {percent(
              leg.modelProbability
            )}
          </strong>
        </div>

        <div>
          <span>
            Market
          </span>

          <strong>
            {percent(
              leg.marketProbability
            )}
          </strong>
        </div>

        <div>
          <span>
            Edge
          </span>

          <strong className="green-value">
            {signedPoints(
              leg.edge
            )}
          </strong>
        </div>

        <div>
          <span>
            EV
          </span>

          <strong
            className={
              Number(
                leg.ev
              ) >= 0
                ? "green-value"
                : "red-value"
            }
          >
            {signedPercent(
              leg.ev
            )}
          </strong>
        </div>

        <div>
          <span>
            Confidence
          </span>

          <strong>
            {leg.confidence ||
              "—"}
          </strong>
        </div>
      </div>

      <div className="builder-leg-actions">
        <button
          type="button"
          onClick={() =>
            onResearch(leg)
          }
        >
          Research matchup
          <ArrowRight
            size={14}
          />
        </button>

        <button
          type="button"
          className="remove"
          onClick={() =>
            onRemove(
              leg.id
            )
          }
        >
          <X size={14} />
          Remove
        </button>
      </div>
    </article>
  );
}

export default function BetBuilderPage({
  legs,
  summary,
  onRemove,
  onClear,
  onResearch,
  onBrowse
}) {
  const warnings =
    warningList(legs);

  return (
    <section className="bet-builder-page">
      <div className="bet-builder-hero">
        <div>
          <span className="product-page-eyebrow">
            CUSTOM ANALYSIS
          </span>

          <h1>
            Bet Builder
          </h1>

          <p>
            Build a ticket from live Banana Bets markets, review each leg, and identify pricing or confidence issues before you decide what belongs on your bet.
          </p>
        </div>

        <div className="builder-hero-count">
          <span>
            YOUR TICKET
          </span>

          <strong>
            {summary.total}
          </strong>

          <small>
            {summary.total === 1
              ? "leg"
              : "legs"}
          </small>
        </div>
      </div>

      {legs.length ===
        0 ? (
        <section className="panel builder-empty-state">
          <CircleDollarSign
            size={34}
          />

          <h2>
            Your ticket is empty
          </h2>

          <p>
            Add a live moneyline from the Moneyline Value Finder to begin. Custom/local-casino entry is reserved in the V1 data structure and will be added in the next phase.
          </p>

          <button
            type="button"
            onClick={onBrowse}
          >
            Browse moneylines
          </button>
        </section>
      ) : (
        <div className="bet-builder-layout">
          <div className="builder-leg-column">
            <div className="builder-section-heading">
              <div>
                <span className="panel-kicker">
                  SELECTED LEGS
                </span>

                <h2>
                  Your Ticket
                </h2>
              </div>

              <button
                type="button"
                className="builder-clear-button"
                onClick={onClear}
              >
                <Trash2
                  size={14}
                />
                Clear ticket
              </button>
            </div>

            <div className="builder-leg-list">
              {legs.map(
                (leg) => (
                  <LegCard
                    key={leg.id}
                    leg={leg}
                    onRemove={
                      onRemove
                    }
                    onResearch={
                      onResearch
                    }
                  />
                )
              )}
            </div>
          </div>

          <aside className="builder-ticket-panel">
            <section className="builder-ticket-card">
              <span className="panel-kicker">
                TICKET HEALTH
              </span>

              <h2>
                Quick Review
              </h2>

              <div className="builder-health-grid">
                <div>
                  <span>
                    Positive EV
                  </span>

                  <strong className="green-value">
                    {summary.positiveEv}
                    {" / "}
                    {summary.total}
                  </strong>
                </div>

                <div>
                  <span>
                    Negative EV
                  </span>

                  <strong className={
                    summary.negativeEv >
                    0
                      ? "red-value"
                      : ""
                  }>
                    {summary.negativeEv}
                    {" / "}
                    {summary.total}
                  </strong>
                </div>

                <div>
                  <span>
                    Low confidence
                  </span>

                  <strong>
                    {summary.lowConfidence}
                    {" / "}
                    {summary.total}
                  </strong>
                </div>

                <div>
                  <span>
                    Avg. edge
                  </span>

                  <strong className="green-value">
                    {signedPoints(
                      summary.averageEdge
                    )}
                  </strong>
                </div>
              </div>

              <div className="builder-analysis-note">
                <strong>
                  Combined model probability
                </strong>

                <span>
                  Not calculated in V1. Same-game legs and related outcomes can be correlated, so Banana will not multiply individual probabilities and present that as a reliable joint probability.
                </span>
              </div>
            </section>

            <section className="builder-ticket-card">
              <span className="panel-kicker">
                REVIEW FLAGS
              </span>

              <h2>
                Potential Issues
              </h2>

              {warnings.length ===
                0 ? (
                <div className="builder-no-warnings">
                  <CheckCircle2
                    size={20}
                  />

                  <span>
                    No obvious pricing or confidence warnings from the current V1 checks.
                  </span>
                </div>
              ) : (
                <div className="builder-warning-list">
                  {warnings.map(
                    (
                      warning,
                      index
                    ) => {
                      const Icon =
                        warning.icon;

                      return (
                        <div
                          key={`${warning.title}-${index}`}
                        >
                          <Icon
                            size={17}
                          />

                          <span>
                            <strong>
                              {warning.title}
                            </strong>

                            <small>
                              {warning.text}
                            </small>
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <section className="builder-ticket-card builder-future-card">
              <span className="panel-kicker">
                COMING NEXT
              </span>

              <h2>
                Custom / Local Casino
              </h2>

              <p>
                V1 already stores each leg with source, sportsbook, market, line, side, and odds fields. The next phase can add manual Ilani/local-casino entries without rebuilding the ticket system.
              </p>
            </section>
          </aside>
        </div>
      )}
    </section>
  );
}
