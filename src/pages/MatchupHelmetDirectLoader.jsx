import React, { useEffect } from "react";

const TEAM_ALIASES = {
  JAC: "JAX",
  LA: "LAR",
  WSH: "WAS"
};

const FILE_OVERRIDES = {
  away: {
    CIN: "CIN-AWAY.png"
  },
  home: {
    CLE: "CLE_AWAY.png",
    LAC: "LAC_AWAY.png"
  }
};

function normalizeTeam(value) {
  const key = String(value || "").trim().toUpperCase();
  return TEAM_ALIASES[key] || key;
}

function splitMatchup(matchup) {
  const parts = String(matchup || "")
    .replace(/\s+/g, " ")
    .split(/\s+(?:@|vs\.?|VS)\s+/i)
    .map((part) => normalizeTeam(part))
    .filter(Boolean);

  if (parts.length >= 2) {
    return { away: parts[0], home: parts[1] };
  }

  return null;
}

function parseGameId(gameId) {
  const parts = String(gameId || "").split("_");
  if (parts.length < 4) return null;
  return {
    away: normalizeTeam(parts[parts.length - 2]),
    home: normalizeTeam(parts[parts.length - 1])
  };
}

function helmetUrl(team, side) {
  const normalized = normalizeTeam(team);
  const suffix = side === "home" ? "HOME" : "AWAY";
  const filename = FILE_OVERRIDES[side]?.[normalized] || `${normalized}_${suffix}.png`;
  return `/helmets/${side}/${filename}`;
}

function selectedTeams(rows) {
  const selectedId = sessionStorage.getItem("banana-bets:selected-matchup") || rows.find((row) => row?.game_id)?.game_id || "";
  const selectedRow = rows.find((row) => row?.game_id === selectedId) || rows[0];
  return splitMatchup(selectedRow?.matchup) || parseGameId(selectedId) || parseGameId(selectedRow?.game_id);
}

function applyHelmet(selector, team, side) {
  const element = document.querySelector(selector);
  if (!element || !team) return;

  const url = helmetUrl(team, side);
  element.dataset.helmetTeam = team;
  element.dataset.helmetSide = side;
  element.style.setProperty("background-image", `url("${url}")`, "important");
  element.style.setProperty("background-size", "contain", "important");
  element.style.setProperty("background-position", "center center", "important");
  element.style.setProperty("background-repeat", "no-repeat", "important");
  element.style.setProperty("image-rendering", "auto", "important");
}

export default function MatchupHelmetDirectLoader({ rows = [] }) {
  useEffect(() => {
    if (!rows.length) return undefined;

    let lastKey = "";

    const render = () => {
      const teams = selectedTeams(rows);
      if (!teams) return;

      const key = `${teams.away}-${teams.home}`;
      const awayElement = document.querySelector(".retro-team-away .retro-helmet-direct");
      const homeElement = document.querySelector(".retro-team-home .retro-helmet-direct");

      if (!awayElement || !homeElement) return;

      if (
        key !== lastKey ||
        awayElement.dataset.helmetTeam !== teams.away ||
        homeElement.dataset.helmetTeam !== teams.home
      ) {
        applyHelmet(".retro-team-away .retro-helmet-direct", teams.away, "away");
        applyHelmet(".retro-team-home .retro-helmet-direct", teams.home, "home");
        lastKey = key;
      }
    };

    render();
    const timer = window.setInterval(render, 120);

    return () => window.clearInterval(timer);
  }, [rows]);

  return null;
}
