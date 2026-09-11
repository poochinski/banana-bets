import React, { useEffect, useState } from "react";
import "./MatchupHelmetAssets.css";

const TEAM_ALIASES = {
  JAC: "JAX",
  LA: "LAR",
  WSH: "WAS"
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
  target.style.backgroundSize = "contain";
  target.style.width = "min(260px, 24vw)";
  target.style.height = "190px";
}

function restoreSprite(selector) {
  const target = document.querySelector(selector);
  if (!target) return;

  target.style.backgroundImage = "";
  target.style.backgroundSize = "";
  target.style.width = "";
  target.style.height = "";
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
      .catch(() => {});

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
