import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Layers3,
  Plus,
  ShieldAlert,
  Trash2,
  X
} from "lucide-react";

function americanOdds(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const rounded = Math.round(number);
  return rounded > 0 ? `+${rounded}` : String(rounded);
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

  const formatted = (number * 100).toFixed(digits);
  return `${number >= 0 ? "+" : ""}${formatted}%`;
}

function signedPoints(value, digits = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const formatted = (number * 100).toFixed(digits);
  return `${number >= 0 ? "+" : ""}${formatted} pp`;
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
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function marketLabel(leg) {
  if (leg.market === "moneyline") {
    return "Moneyline";
  }

  if (leg.market === "spread") {
    return "Point Spread";
  }

  if (leg.market === "total") {
    return "Total Points";
  }

  return String(leg.market || "Market")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function selectionLabel(leg) {
  if (leg.market === "moneyline") {
    return leg.team || leg.side || "Selection";
  }

  if (leg.player) {
    return `${leg.player} ${leg.side || ""} ${leg.line ?? ""}`.trim();
  }

  return `${leg.side || leg.team || "Selection"} ${leg.line ?? ""}`.trim();
}

function toDecimalOdds(value) {
  const odds = Number(value);

  if (!Number.isFinite(odds) || odds === 0) {
    return null;
  }

  return odds > 0
    ? 1 + odds / 100
    : 1 + 100 / Math.abs(odds);
}

function decimalToAmerican(decimal) {
  if (!Number.isFinite(decimal) || decimal <= 1) {
    return null;
  }

  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }

  return Math.round(-100 / (decimal - 1));
}

function combinedListedOdds(legs) {
  if (!legs.length) {
    return null;
  }

  const decimals = legs.map((leg) => toDecimalOdds(leg.odds));

  if (decimals.some((value) => value === null)) {
    return null;
  }

  return decimals.reduce((product, value) => product * value, 1);
}

function makeTicketId(legs) {
  const source = legs.map((leg) => leg.id || leg.team || "leg").join("|");
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `BB${String(Math.abs(hash >>> 0)).padStart(10, "0")}`;
}

function warningList(legs) {
  const warnings = [];

  const low = legs.filter((leg) => leg.confidence === "LOW");

  if (low.length > 0) {
    warnings.push({
      icon: ShieldAlert,
      title: "Low-confidence legs",
      text: `${low.length} of ${legs.length} selected legs currently carry LOW model confidence.`
    });
  }

  const negative = legs.filter((leg) => Number(leg.ev) < 0);

  if (negative.length > 0) {
    warnings.push({
      icon: AlertTriangle,
      title: "Negative-EV leg",
      text: `${negative
        .map((leg) => `${leg.team} ${americanOdds(leg.odds)}`)
        .join(", ")} currently price worse than Banana's estimate.`
    });
  }

  const gameMap = legs.reduce((result, leg) => {
    const key = leg.gameId || leg.matchup;

    if (!key) {
      return result;
    }

    result[key] = [...(result[key] || []), leg];
    return result;
  }, {});

  Object.values(gameMap).forEach((gameLegs) => {
    if (gameLegs.length > 1) {
      warnings.push({
        icon: Layers3,
        title: "Same-game legs",
        text: "Multiple legs come from the same game. Banana does not calculate a correlation-aware combined model probability in V1."
      });
    }
  });

  return warnings;
}

function CompactLegRow({ leg, index, onRemove, onResearch }) {
  return (
    <article className="builder-selection-row">
      <span className="builder-selection-number">{index + 1}</span>

      <div className="builder-selection-game">
        <strong>{leg.matchup || leg.team}</strong>
        <span>{displayBook(leg.sportsbook)}</span>
      </div>

      <div className="builder-selection-detail">
        <span>Market</span>
        <strong>{marketLabel(leg)}</strong>
      </div>

      <div className="builder-selection-detail">
        <span>Selection</span>
        <strong>{selectionLabel(leg)}</strong>
      </div>

      <div className="builder-selection-detail builder-selection-odds">
        <span>Odds</span>
        <strong>{americanOdds(leg.odds)}</strong>
      </div>

      <div className="builder-selection-model">
        <strong>{percent(leg.modelProbability)}</strong>
        <span>Banana</span>
      </div>

      <div className="builder-selection-model">
        <strong className={Number(leg.ev) >= 0 ? "green-value" : "red-value"}>
          {signedPercent(leg.ev)}
        </strong>
        <span>EV</span>
      </div>

      <div className="builder-selection-actions">
        <button type="button" onClick={() => onResearch(leg)}>
          Research <ArrowRight size={13} />
        </button>

        <button
          type="button"
          className="remove"
          onClick={() => onRemove(leg.id)}
          aria-label={`Remove ${selectionLabel(leg)}`}
        >
          <X size={14} />
        </button>
      </div>
    </article>
  );
}

function ReceiptLeg({ leg, index, onRemove }) {
  return (
    <div className="receipt-leg">
      <div className="receipt-leg-title">
        <strong>{index + 1}. {leg.matchup || leg.team}</strong>
        <span>{americanOdds(leg.odds)}</span>
      </div>

      <div className="receipt-leg-body">
        <span>NFL / {displayBook(leg.sportsbook)}</span>
        <span>{marketLabel(leg)}</span>
        <strong>{selectionLabel(leg)}</strong>
      </div>

      <button
        type="button"
        className="receipt-remove"
        onClick={() => onRemove(leg.id)}
        aria-label={`Remove ${selectionLabel(leg)} from bet slip`}
      >
        ×
      </button>
    </div>
  );
}

function BetSlip({ legs, wager, setWager, onRemove }) {
  const combinedDecimal = useMemo(() => combinedListedOdds(legs), [legs]);
  const combinedAmerican = decimalToAmerican(combinedDecimal);
  const wagerNumber = Math.max(0, Number(wager) || 0);
  const payout = combinedDecimal ? wagerNumber * combinedDecimal : 0;
  const ticketId = useMemo(() => makeTicketId(legs), [legs]);

  return (
    <aside className="receipt-wrap" aria-label="Banana Bets bet slip">
      <div className="bet-receipt">
        <div className="receipt-brand">
          <img src="/banana-bets-logo.png" alt="Banana Bets" />
          <div>
            <strong>BANANA BETS</strong>
            <span>PEEL BACK THE NUMBERS.</span>
          </div>
        </div>

        <div className="receipt-rule" />

        <h2>BET SLIP</h2>
        <div className="receipt-rule" />

        <div className="receipt-meta">
          <span>Ticket No:</span>
          <strong>{ticketId}</strong>
          <span>Status:</span>
          <strong>DRAFT</strong>
          <span>Source:</span>
          <strong>BananaBets.com</strong>
        </div>

        <div className="receipt-rule" />

        <div className="receipt-summary-line">
          <strong>{legs.length} Leg {legs.length === 1 ? "Selection" : "Parlay"}</strong>
          <strong>{combinedAmerican ? americanOdds(combinedAmerican) : "—"}</strong>
        </div>

        <label className="receipt-wager-row">
          <span>Wager:</span>
          <span className="receipt-money-input">
            $
            <input
              type="number"
              min="0"
              step="1"
              value={wager}
              onChange={(event) => setWager(event.target.value)}
              aria-label="Wager amount"
            />
          </span>
        </label>

        <div className="receipt-summary-line receipt-payout">
          <span>Potential Payout:</span>
          <strong>${payout.toFixed(2)}</strong>
        </div>

        <div className="receipt-rule" />

        <div className="receipt-leg-list">
          {legs.length ? (
            legs.map((leg, index) => (
              <ReceiptLeg
                key={leg.id}
                leg={leg}
                index={index}
                onRemove={onRemove}
              />
            ))
          ) : (
            <div className="receipt-empty">
              <strong>NO SELECTIONS</strong>
              <span>Add a leg from the Moneyline Value Finder.</span>
            </div>
          )}
        </div>

        <div className="receipt-rule" />

        <div className="receipt-disclaimer">
          <strong>DRAFT ANALYSIS ONLY</strong>
          <span>This is not a placed wager or sportsbook confirmation.</span>
          <span>Combined odds use the listed prices only. Banana does not calculate a combined model probability in V1.</span>
        </div>

        <div className="receipt-barcode" aria-hidden="true" />
        <div className="receipt-ticket-id">{ticketId}</div>
      </div>
    </aside>
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
  const warnings = warningList(legs);
  const [wager, setWager] = useState("10");

  return (
    <section className="bet-builder-page receipt-builder-page">
      <div className="receipt-builder-header">
        <div>
          <span className="product-page-eyebrow">CUSTOM ANALYSIS</span>
          <h1>Bet Builder</h1>
          <p>
            Build your ticket from Banana Bets markets. Your selections print directly onto the live bet slip while Banana keeps the model analysis beside it.
          </p>
        </div>

        <div className="receipt-builder-header-actions">
          <button type="button" className="builder-add-leg" onClick={onBrowse}>
            <Plus size={15} /> Add Leg
          </button>

          {legs.length > 0 && (
            <button type="button" className="builder-clear-button dark" onClick={onClear}>
              <Trash2 size={14} /> Clear Ticket
            </button>
          )}
        </div>
      </div>

      <div className="receipt-builder-grid">
        <main className="receipt-builder-main">
          <div className="builder-overview-grid">
            <section className="builder-overview-card">
              <span className="panel-kicker">TICKET HEALTH</span>
              <h2>Quick Review</h2>

              <div className="receipt-health-stats">
                <div>
                  <span>Positive EV</span>
                  <strong className="green-value">{summary.positiveEv} / {summary.total}</strong>
                </div>
                <div>
                  <span>Negative EV</span>
                  <strong className={summary.negativeEv > 0 ? "red-value" : ""}>{summary.negativeEv} / {summary.total}</strong>
                </div>
                <div>
                  <span>Low Confidence</span>
                  <strong>{summary.lowConfidence} / {summary.total}</strong>
                </div>
                <div>
                  <span>Avg. Edge</span>
                  <strong className="green-value">{signedPoints(summary.averageEdge)}</strong>
                </div>
              </div>

              <div className="builder-analysis-note light-note">
                <strong>Combined model probability is intentionally not shown.</strong>
                <span>Related legs can be correlated, so Banana will not multiply individual model probabilities and pretend that result is a reliable parlay probability.</span>
              </div>
            </section>

            <section className="builder-overview-card">
              <span className="panel-kicker">REVIEW FLAGS</span>
              <h2>Potential Issues</h2>

              {warnings.length === 0 ? (
                <div className="builder-no-warnings light">
                  <CheckCircle2 size={20} />
                  <span>No obvious pricing or confidence warnings from the current V1 checks.</span>
                </div>
              ) : (
                <div className="builder-warning-list light">
                  {warnings.map((warning, index) => {
                    const Icon = warning.icon;
                    return (
                      <div key={`${warning.title}-${index}`}>
                        <Icon size={17} />
                        <span>
                          <strong>{warning.title}</strong>
                          <small>{warning.text}</small>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="builder-selected-heading">
            <div>
              <span className="panel-kicker">SELECTED LEGS</span>
              <h2>Ticket Selections ({legs.length})</h2>
            </div>

            {legs.length === 0 && (
              <button type="button" onClick={onBrowse}>
                <CircleDollarSign size={15} /> Browse Moneylines
              </button>
            )}
          </div>

          {legs.length > 0 ? (
            <div className="builder-selection-list">
              {legs.map((leg, index) => (
                <CompactLegRow
                  key={leg.id}
                  leg={leg}
                  index={index}
                  onRemove={onRemove}
                  onResearch={onResearch}
                />
              ))}
            </div>
          ) : (
            <section className="builder-empty-dark">
              <CircleDollarSign size={32} />
              <h3>Your bet slip is empty</h3>
              <p>Add a live moneyline from the Value Finder. The receipt will update instantly as selections are added.</p>
              <button type="button" onClick={onBrowse}>Browse Moneylines</button>
            </section>
          )}

          <section className="builder-custom-preview">
            <span className="panel-kicker">NEXT PHASE</span>
            <h3>Local Casino / Custom Odds</h3>
            <p>
              The ticket structure already supports source, sportsbook, market, line, side, and odds. Next we can add manual Ilani/local-casino bets directly to this same receipt.
            </p>
          </section>
        </main>

        <BetSlip
          legs={legs}
          wager={wager}
          setWager={setWager}
          onRemove={onRemove}
        />
      </div>
    </section>
  );
}
