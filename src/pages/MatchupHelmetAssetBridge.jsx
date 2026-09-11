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

function applyAwayHelmet(team) {
  const normalized = normalizeTeam(team);
  const position = AWAY_SPRITE_POSITIONS[normalized];
  const helmet = document.querySelector(".retro-team-away .retro-helmet-sprite");

  if (!helmet || !position) return;

  const [column, row] = position;

  helmet.classList.add("retro-away-helmet-live");
  helmet.classList.remove("retro-away-helmet-individual");
  helmet.style.setProperty("--away-helmet-column", String(column));
  helmet.style.setProperty("--away-helmet-row", String(row));

  const individualSrc = `/helmets/away/${normalized}_AWAY.png`;

  preload(individualSrc)
    .then(() => {
      const current = document.querySelector(".retro-team-away .retro-helmet-sprite");
      if (!current) return;
      current.classList.add("retro-away-helmet-live", "retro-away-helmet-individual");
      current.style.setProperty("--away-helmet-image", `url(\"${individualSrc}\")`);
    })
    .catch(() => {
      const current = document.querySelector(".retro-team-away .retro-helmet-sprite");
      if (!current) return;
      current.classList.remove("retro-away-helmet-individual");
      current.style.removeProperty("--away-helmet-image");
    });
}

export default function MatchupHelmetAssetBridge({ rows = [] }) {
  const fallbackGameId = rows.find((row) => row?.game_id)?.game_id || "";
  const [gameId, setGameId] = useState(
    () => sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId
  );

  useEffect(() => {
    const sync = () => {
      const next = sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId;
      if (next) setGameId((current) => (current === next ? current : next));
    };

    sync();
    const timer = window.setInterval(sync, 250);
    return () => window.clearInterval(timer);
  }, [fallbackGameId]);

  useEffect(() => {
    const teams = parseGameId(gameId);
    if (!teams) return undefined;

    const apply = () => applyAwayHelmet(teams.away);
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [gameId]);

  return null;
}
