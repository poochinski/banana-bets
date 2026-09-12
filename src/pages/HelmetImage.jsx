import React, { useState } from "react";

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

function normalizeTeam(team) {
  const key = String(team || "").trim().toUpperCase();
  return TEAM_ALIASES[key] || key;
}

function helmetPath(team, side) {
  const normalized = normalizeTeam(team);
  const suffix = side === "home" ? "HOME" : "AWAY";
  const filename = FILE_OVERRIDES[side]?.[normalized] || `${normalized}_${suffix}.png`;
  return `/helmets/${side}/${filename}`;
}

export default function HelmetImage({ team, side = "away" }) {
  const normalized = normalizeTeam(team);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="retro-helmet-fallback">{normalized}</div>;
  }

  return (
    <img
      className={`retro-helmet-direct retro-helmet-${side}`}
      src={helmetPath(normalized, side)}
      alt={`${normalized} ${side} helmet`}
      draggable="false"
      onError={() => setFailed(true)}
    />
  );
}
