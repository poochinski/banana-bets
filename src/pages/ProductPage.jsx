import React from "react";
import PlayerPropsPage from "./PlayerPropsPage";
import GamePredictionsPage from "./GamePredictionsPage";

const PAGE_CONTENT = {
  "Game Predictions": {
    eyebrow: "GAME MARKETS",
    title: "Game Predictions",
    description:
      "One home for moneyline, spread, and total projections. This page will compare Banana model probabilities with sportsbook prices and connect each game to deeper matchup research.",
    cards: [
      ["Moneyline", "Model win probability, market probability, fair odds, edge, EV, and confidence."],
      ["Spreads", "Projected margin versus the sportsbook spread, with model edge and supporting context."],
      ["Totals", "Projected scoring environment versus the market total, with game-pace and efficiency context."]
    ]
  },
  "Player Props": {
    eyebrow: "PLAYER MARKETS",
    title: "Player Props",
    description:
      "Research and compare passing, rushing, receiving, reception, touchdown, and other player markets without leaving Banana Bets.",
    cards: [
      ["Prop Finder", "Filter by player, game, team, position, market, sportsbook, edge, and confidence."],
      ["Prop Analysis", "Compare sportsbook line, Banana projection, probability, edge, usage, recent form, and matchup."],
      ["Market Context", "See relevant opponent tendencies and game environment alongside the model output."]
    ]
  },
  "Matchup Breakdown": {
    eyebrow: "RESEARCH CENTER",
    title: "Matchup Breakdown",
    description:
      "The do-your-own-research side of Banana Bets. Compare two teams head-to-head using the football statistics that matter most to betting decisions.",
    cards: [
      ["Team vs Team", "Helmet-style matchup header with projected score, market lines, and major strengths and weaknesses."],
      ["Advanced Matchup", "EPA, success rate, explosive plays, pressure, red-zone performance, pace, and situational splits."],
      ["Environment", "Weather, surface, injuries, home/away context, and other variables that can change a betting decision."]
    ]
  },
  "Bet Builder": {
    eyebrow: "CUSTOM ANALYSIS",
    title: "Bet Builder",
    description:
      "Build a custom set of wagers and review each leg with Banana model context before deciding what belongs on your ticket.",
    cards: [
      ["Add Legs", "Combine game markets and player props into one research workspace."],
      ["Leg Support", "Review model probability, market price, edge, and confidence for each selection."],
      ["Correlation", "Future support for identifying legs that may move together instead of treating every selection as independent."]
    ]
  },
  "Trends & Angles": {
    eyebrow: "HISTORICAL RESEARCH",
    title: "Trends & Angles",
    description:
      "Separate historical betting patterns from model predictions so users can explore trends without confusing them with forecast probabilities.",
    cards: [
      ["Situational Trends", "Home/away, favorite/underdog, divisional, rest, and other historical splits."],
      ["Sample Size", "Always show how many games support a trend so percentages are not viewed without context."],
      ["Model Comparison", "Later compare historical angles with the current Banana prediction instead of replacing it."]
    ]
  },
  "My Bets": {
    eyebrow: "PERSONAL TRACKING",
    title: "My Bets",
    description:
      "A future watchlist and bet-tracking workspace for selections you want to follow.",
    cards: [
      ["Watchlist", "Save a game, side, total, or prop while its live model values continue to update."],
      ["Bet Log", "Store selected odds, model probability, EV, closing price, and final result."],
      ["Performance", "Eventually review personal ROI, closing-line value, and performance by market."]
    ]
  },
  "Model Performance": {
    eyebrow: "TRANSPARENCY",
    title: "Model Performance",
    description:
      "Show whether Banana predictions have actually performed well instead of asking users to trust a confidence badge.",
    cards: [
      ["Validation", "Historical sample size, prediction error, calibration, and other model diagnostics."],
      ["Market Results", "Moneyline, spread, total, and eventually player-prop performance by threshold and edge."],
      ["Track Record", "Future ROI and closing-line-value reporting using only properly recorded historical recommendations."]
    ]
  },
  "How Banana Works": {
    eyebrow: "LEARN BANANA BETS",
    title: "How Banana Works",
    description:
      "Explain model probability, market probability, fair odds, edge, EV, confidence, and qualified plays in plain language.",
    cards: [
      ["Model", "What Banana estimates and what a model projection does — and does not — mean."],
      ["Market", "How sportsbook odds translate to implied probability and why price matters."],
      ["Matchup", "How to use research alongside the model instead of treating any prediction as a guarantee."]
    ]
  }
};

export default function ProductPage({ page }) {
  if (page === "Game Predictions") {
    return <GamePredictionsPage />;
  }

  if (page === "Player Props") {
    return <PlayerPropsPage season="2026" week="Week 1" />;
  }

  const content =
    PAGE_CONTENT[page] ||
    PAGE_CONTENT["Game Predictions"];

  return (
    <section className="product-page">
      <div className="product-page-hero">
        <span className="product-page-eyebrow">
          {content.eyebrow}
        </span>

        <h1>{content.title}</h1>

        <p>{content.description}</p>

        <div className="product-page-status">
          Foundation layout
        </div>
      </div>

      <div className="product-page-grid">
        {content.cards.map(
          ([title, description]) => (
            <article
              className="product-page-card panel"
              key={title}
            >
              <span className="panel-kicker">
                PLANNED MODULE
              </span>

              <h2>{title}</h2>

              <p>{description}</p>
            </article>
          )
        )}
      </div>

      <section className="panel product-page-note">
        <span className="panel-kicker">
          BUILD STATUS
        </span>

        <h3>
          Page shell is ready for live data.
        </h3>

        <p>
          The layout is intentionally separated
          from prediction logic. As new fields are
          exposed by the Banana Bets API, this page
          can display them without recreating model
          calculations in React.
        </p>
      </section>
    </section>
  );
}
