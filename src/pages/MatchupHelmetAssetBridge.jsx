import React, { useEffect, useState } from "react";
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

function preload(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(src);
    image.onerror = reject;
    image.src = src;
  });
}

function applyIndividualHelmet(selector, src) {
  const target = document.querySelector(selector);
  if (!target) return;

  target.style.backgroundImage = `url("${src}")`;
  target.style.backgroundPosition = "center";
  target.style.backgroundRepeat = "no-repeat";
  target.style.backgroundSize = "contain";
  target.style.width = "min(260px, 24vw)";
  target.style.height = "190px";
}

function applyAwaySprite(team) {
  const target = document.querySelector(".retro-team-away .retro-helmet-sprite");
  const position = AWAY_SPRITE_POSITIONS[normalizeTeam(team)];
  if (!target || !position) return;

  const [column, row] = position;
  target.style.backgroundImage = 'url("/helmets/away/away-helmets-sprite.png")';
  target.style.backgroundRepeat = "no-repeat";
  target.style.backgroundSize = "1040px 1536px";
  target.style.backgroundPosition = `${-column * 260}px ${-row * 192}px`;
  target.style.width = "260px";
  target.style.height = "192px";
  target.style.imageRendering = "pixelated";
}

function restoreSprite(selector) {
  const target = document.querySelector(selector);
  if (!target) return;

  target.style.backgroundImage = "";
  target.style.backgroundPosition = "";
  target.style.backgroundRepeat = "";
  target.style.backgroundSize = "";
  target.style.width = "";
  target.style.height = "";
  target.style.imageRendering = "";
}

export default function MatchupHelmetAssetBridge({ rows = [] }) {
  const fallbackGameId = rows.find((row) => row?.game_id)?.game_id || "";
  const [gameId, setGameId] = useState(
    () => sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId;
      setGameId((current) => (next && next !== current ? next : current));
    }, 250);

    return () => window.clearInterval(timer);
  }, [fallbackGameId]);

  useEffect(() => {
    const teams = parseGameId(gameId);
    if (!teams) return undefined;

    let cancelled = false;

    const awaySrc = `/helmets/away/${teams.away}_AWAY.png`;
    const homeSrc = `/helmets/home/${teams.home}_HOME.png`;

    restoreSprite(".retro-team-away .retro-helmet-sprite");
    restoreSprite(".retro-team-home .retro-helmet-sprite");

    preload(awaySrc)
      .then(() => {
        if (!cancelled) {
          applyIndividualHelmet(".retro-team-away .retro-helmet-sprite", awaySrc);
        }
      })
      .catch(() => {
        if (!cancelled) applyAwaySprite(teams.away);
      });

    preload(homeSrc)
      .then(() => {
        if (!cancelled) {
          applyIndividualHelmet(".retro-team-home .retro-helmet-sprite", homeSrc);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return null;
}
