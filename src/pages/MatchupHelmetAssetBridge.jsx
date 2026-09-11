import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./MatchupHelmetAssets.css";

const TEAM_ALIASES = {
  JAC: "JAX",
  LA: "LAR",
  WSH: "WAS"
};

const AWAY_SPRITE_POSITIONS = {
  BAL: [0, 0], CIN: [1, 0], CLE: [2, 0], PIT: [3, 0],
  HOU: [0, 1], IND: [1, 1], JAX: [2, 1], TEN: [3, 1],
  BUF: [0, 2], MIA: [1, 2], NE: [2, 2], NYJ: [3, 2],
  DEN: [0, 3], LV: [1, 3], LAC: [2, 3], KC: [3, 3],
  CHI: [0, 4], DET: [1, 4], GB: [2, 4], MIN: [3, 4],
  ATL: [0, 5], CAR: [1, 5], NO: [2, 5], TB: [3, 5],
  DAL: [0, 6], NYG: [1, 6], PHI: [2, 6], WAS: [3, 6],
  ARI: [0, 7], LAR: [1, 7], SF: [2, 7], SEA: [3, 7]
};

function normalizeTeam(value) {
  const key = String(value || "").trim().toUpperCase();
  return TEAM_ALIASES[key] || key;
}

function parseGameId(gameId) {
  const parts = String(gameId || "").split("_");
  if (parts.length < 4) return null;
  return {
    away: normalizeTeam(parts[parts.length - 2]),
    home: normalizeTeam(parts[parts.length - 1])
  };
}

function AwayHelmetVisual({ team }) {
  const normalized = normalizeTeam(team);
  const [useSprite, setUseSprite] = useState(false);
  const position = AWAY_SPRITE_POSITIONS[normalized];
  const individualSrc = `/helmets/away/${normalized}_AWAY.png`;

  if (!useSprite) {
    return (
      <div className="retro-helmet-bridge-slot">
        <img
          className="retro-helmet-individual"
          src={individualSrc}
          alt={`${normalized} away helmet`}
          onError={() => setUseSprite(true)}
        />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="retro-helmet-bridge-slot">
        <div className="retro-helmet-fallback">{normalized}</div>
      </div>
    );
  }

  const [column, row] = position;

  return (
    <div className="retro-helmet-bridge-slot">
      <div
        className="retro-away-helmet-sprite"
        role="img"
        aria-label={`${normalized} away helmet`}
        style={{
          backgroundPosition: `${-column * 260}px ${-row * 192}px`
        }}
      />
    </div>
  );
}

export default function MatchupHelmetAssetBridge({ rows = [] }) {
  const fallbackGameId = rows.find((row) => row?.game_id)?.game_id || "";
  const [gameId, setGameId] = useState(
    () => sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId
  );
  const [awayTarget, setAwayTarget] = useState(null);

  useEffect(() => {
    const syncGame = () => {
      const next = sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId;
      if (next) {
        setGameId((current) => (next !== current ? next : current));
      }
    };

    syncGame();
    const timer = window.setInterval(syncGame, 250);
    return () => window.clearInterval(timer);
  }, [fallbackGameId]);

  useEffect(() => {
    const findTarget = () => {
      const target = document.querySelector(".retro-team-away");
      setAwayTarget((current) => (current === target ? current : target));
    };

    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!awayTarget) return undefined;

    awayTarget.classList.add("helmet-asset-bridge-active");
    return () => awayTarget.classList.remove("helmet-asset-bridge-active");
  }, [awayTarget]);

  const teams = parseGameId(gameId);
  if (!teams || !awayTarget) return null;

  return createPortal(
    <AwayHelmetVisual key={teams.away} team={teams.away} />,
    awayTarget
  );
}
