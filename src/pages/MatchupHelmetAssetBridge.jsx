import React, { useEffect } from "react";

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

const LOCAL_SPRITE = "/helmets/away/away-helmets-sprite.png";
const RAW_SPRITE = "https://raw.githubusercontent.com/poochinski/banana-bets/main/public/helmets/away/away-helmets-sprite.png";

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

function spriteGeometry() {
  const width = window.innerWidth;
  if (width <= 620) return { cellWidth: 208, cellHeight: 152 };
  if (width <= 900) return { cellWidth: 234, cellHeight: 171 };
  if (width <= 1100) return { cellWidth: 260, cellHeight: 190 };
  return { cellWidth: 312, cellHeight: 228 };
}

function setImportant(style, property, value) {
  if (
    style.getPropertyValue(property) !== value ||
    style.getPropertyPriority(property) !== "important"
  ) {
    style.setProperty(property, value, "important");
  }
}

function forceAwayHelmet(team, spriteUrl) {
  const normalized = normalizeTeam(team);
  const position = AWAY_SPRITE_POSITIONS[normalized];
  const helmet = document.querySelector(".retro-team-away .retro-helmet-sprite");
  if (!helmet || !position) return;

  const [column, row] = position;
  const { cellWidth, cellHeight } = spriteGeometry();
  const style = helmet.style;

  setImportant(style, "display", "block");
  setImportant(style, "visibility", "visible");
  setImportant(style, "opacity", "1");
  setImportant(style, "width", `${cellWidth}px`);
  setImportant(style, "height", `${cellHeight}px`);
  setImportant(style, "min-width", `${cellWidth}px`);
  setImportant(style, "min-height", `${cellHeight}px`);
  setImportant(style, "background-image", `url(\"${spriteUrl}\")`);
  setImportant(style, "background-repeat", "no-repeat");
  setImportant(style, "background-size", `${cellWidth * 4}px ${cellHeight * 8}px`);
  setImportant(style, "background-position", `${-column * cellWidth}px ${-row * cellHeight}px`);
  setImportant(style, "image-rendering", "pixelated");
  setImportant(style, "position", "relative");
  setImportant(style, "z-index", "8");
  setImportant(style, "margin", "0 auto 2px");
  setImportant(
    style,
    "filter",
    "drop-shadow(0 9px 0 rgba(0,0,0,.24)) drop-shadow(0 0 14px rgba(255,255,255,.13))"
  );
}

export default function MatchupHelmetAssetBridge({ rows = [] }) {
  useEffect(() => {
    const fallbackGameId = rows.find((row) => row?.game_id)?.game_id || "";
    let spriteUrl = LOCAL_SPRITE;
    let cancelled = false;

    const spriteProbe = new Image();
    spriteProbe.onload = () => {
      if (!cancelled) spriteUrl = LOCAL_SPRITE;
    };
    spriteProbe.onerror = () => {
      if (!cancelled) spriteUrl = RAW_SPRITE;
    };
    spriteProbe.src = LOCAL_SPRITE;

    const render = () => {
      const gameId = sessionStorage.getItem("banana-bets:selected-matchup") || fallbackGameId;
      const teams = parseGameId(gameId);
      if (teams) forceAwayHelmet(teams.away, spriteUrl);
    };

    render();
    const timer = window.setInterval(render, 200);
    window.addEventListener("resize", render);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("resize", render);
    };
  }, [rows]);

  return null;
}
