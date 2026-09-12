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

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

export function marketRowToLeg(row, market = null) {
  const normalizedMarket = String(
    market || row.market || "moneyline"
  ).toLowerCase();

  const side =
    normalizedMarket === "moneyline" ||
    normalizedMarket === "spread"
      ? String(row.team || row.side || "")
      : String(
          row.team ||
          row.side ||
          row.selection ||
          row.bet_side ||
          ""
        ).toUpperCase();

  const team =
    normalizedMarket === "total"
      ? ""
      : String(row.team || "");

  const line =
    numberOrNull(
      row.line ??
      row.spread ??
      row.total ??
      row.market_line ??
      row.total_line
    );

  const base = {
    source: "banana",
    market: normalizedMarket,
    gameId:
      row.game_id ||
      row.matchup ||
      "",
    team,
    player: "",
    side
  };

  return {
    id: legId(base),
    source: "banana",
    sourceLabel: "Banana API",
    sportsbook:
      row.sportsbook ||
      "",
    sport: "NFL",
    market: normalizedMarket,
    gameId:
      row.game_id ||
      row.matchup ||
      "",
    matchup:
      row.matchup ||
      "",
    team,
    player: "",
    side,
    line,
    odds:
      numberOrNull(
        row.american_odds
      ),
    fairOdds:
      numberOrNull(
        row.fair_odds
      ),
    modelProbability:
      numberOrNull(
        row.model_win_prob ??
        row.model_prob ??
        row.cover_probability
      ),
    marketProbability:
      numberOrNull(
        row.market_win_prob ??
        row.market_prob
      ),
    edge:
      numberOrNull(
        row.edge_vs_market
      ),
    ev:
      numberOrNull(
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

export function moneylineRowToLeg(row) {
  return marketRowToLeg(
    row,
    "moneyline"
  );
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

  useEffect(() => {
    function handleExternalAdd(event) {
      const leg = event?.detail;

      if (!leg || typeof leg !== "object") {
        return;
      }

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

    window.addEventListener(
      "banana-bets:add-builder-leg",
      handleExternalAdd
    );

    return () => {
      window.removeEventListener(
        "banana-bets:add-builder-leg",
        handleExternalAdd
      );
    };
  }, []);

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
