import { useEffect, useMemo, useState } from "react";

export const BET_BUILDER_STORAGE_KEY =
  "banana-bets-builder-v1";

function readStoredLegs() {
  try {
    const raw =
      localStorage.getItem(
        BET_BUILDER_STORAGE_KEY
      );

    const parsed =
      raw
        ? JSON.parse(raw)
        : [];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function legId(leg) {
  return [
    leg.source || "banana",
    leg.market || "moneyline",
    leg.gameId || leg.matchup || "",
    leg.team || "",
    leg.player || "",
    leg.side || ""
  ].join("|");
}

export function moneylineRowToLeg(row) {
  return {
    id: legId({
      source: "banana",
      market: "moneyline",
      gameId:
        row.game_id ||
        row.matchup,
      team: row.team,
      side: row.team
    }),
    source: "banana",
    sourceLabel:
      "Banana API",
    sportsbook:
      row.sportsbook ||
      "",
    sport: "NFL",
    market: "moneyline",
    gameId:
      row.game_id ||
      row.matchup ||
      "",
    matchup:
      row.matchup ||
      "",
    team:
      row.team ||
      "",
    player: "",
    side:
      row.team ||
      "",
    line: null,
    odds:
      Number(
        row.american_odds
      ),
    fairOdds:
      Number(
        row.fair_odds
      ),
    modelProbability:
      Number(
        row.model_win_prob
      ),
    marketProbability:
      Number(
        row.market_win_prob
      ),
    edge:
      Number(
        row.edge_vs_market
      ),
    ev:
      Number(
        row.ev
      ),
    confidence:
      String(
        row.confidence ||
        ""
      ).toUpperCase(),
    meetsThreshold:
      Boolean(
        row.meets_threshold
      ),
    addedAt:
      new Date().toISOString()
  };
}

export default function useBetBuilder() {
  const [legs, setLegs] =
    useState(
      readStoredLegs
    );

  useEffect(() => {
    localStorage.setItem(
      BET_BUILDER_STORAGE_KEY,
      JSON.stringify(legs)
    );
  }, [legs]);

  function addLeg(leg) {
    const normalized = {
      ...leg,
      id:
        leg.id ||
        legId(leg)
    };

    setLegs((current) => {
      const index =
        current.findIndex(
          (item) =>
            item.id ===
            normalized.id
        );

      if (index === -1) {
        return [
          ...current,
          normalized
        ];
      }

      const copy =
        [...current];

      copy[index] =
        normalized;

      return copy;
    });
  }

  function removeLeg(id) {
    setLegs(
      (current) =>
        current.filter(
          (leg) =>
            leg.id !== id
        )
    );
  }

  function clearLegs() {
    setLegs([]);
  }

  function hasLeg(id) {
    return legs.some(
      (leg) =>
        leg.id === id
    );
  }

  const summary =
    useMemo(() => {
      const finiteEv =
        legs.filter(
          (leg) =>
            Number.isFinite(
              Number(
                leg.ev
              )
            )
        );

      const positiveEv =
        finiteEv.filter(
          (leg) =>
            Number(
              leg.ev
            ) > 0
        ).length;

      const negativeEv =
        finiteEv.filter(
          (leg) =>
            Number(
              leg.ev
            ) < 0
        ).length;

      const lowConfidence =
        legs.filter(
          (leg) =>
            String(
              leg.confidence
            ).toUpperCase() ===
            "LOW"
        ).length;

      const averageEdge =
        legs.length
          ? legs.reduce(
              (sum, leg) =>
                sum +
                (
                  Number.isFinite(
                    Number(
                      leg.edge
                    )
                  )
                    ? Number(
                        leg.edge
                      )
                    : 0
                ),
              0
            ) /
            legs.length
          : 0;

      return {
        total: legs.length,
        positiveEv,
        negativeEv,
        lowConfidence,
        averageEdge
      };
    }, [legs]);

  return {
    legs,
    addLeg,
    removeLeg,
    clearLegs,
    hasLeg,
    summary
  };
}
