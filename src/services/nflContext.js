const ESPN_SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const ESPN_CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";
const OPEN_METEO_GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

const TEAM_IDS = {
  ARI: 22,
  ATL: 1,
  BAL: 33,
  BUF: 2,
  CAR: 29,
  CHI: 3,
  CIN: 4,
  CLE: 5,
  DAL: 6,
  DEN: 7,
  DET: 8,
  GB: 9,
  HOU: 34,
  IND: 11,
  JAX: 30,
  KC: 12,
  LV: 13,
  LAC: 24,
  LAR: 14,
  MIA: 15,
  MIN: 16,
  NE: 17,
  NO: 18,
  NYG: 19,
  NYJ: 20,
  PHI: 21,
  PIT: 23,
  SEA: 26,
  SF: 25,
  TB: 27,
  TEN: 10,
  WAS: 28
};

const TEAM_ALIASES = {
  JAC: "JAX",
  LA: "LAR",
  WSH: "WAS"
};

function normalizeTeam(value) {
  const key = String(value || "").trim().toUpperCase();
  return TEAM_ALIASES[key] || key;
}

async function fetchJson(url) {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function matchEvent(events, away, home) {
  const awayKey = normalizeTeam(away);
  const homeKey = normalizeTeam(home);

  return events.find((event) => {
    const competitors = event?.competitions?.[0]?.competitors || [];
    const abbreviations = competitors.map((item) => normalizeTeam(item?.team?.abbreviation));
    return abbreviations.includes(awayKey) && abbreviations.includes(homeKey);
  }) || null;
}

function getCompetitor(event, homeAway) {
  return event?.competitions?.[0]?.competitors?.find((item) => item.homeAway === homeAway) || null;
}

function recordSummary(competitor) {
  const record = competitor?.records?.find((item) => item.type === "total") || competitor?.records?.[0];
  return record?.summary || "—";
}

function flattenStats(payload) {
  const categories = payload?.splits?.categories || [];
  const map = {};

  categories.forEach((category) => {
    (category?.stats || []).forEach((stat) => {
      const key = stat?.name;
      if (!key) return;

      map[key] = {
        value: stat?.value,
        displayValue: stat?.displayValue ?? String(stat?.value ?? "—"),
        displayName: stat?.displayName || stat?.shortDisplayName || key,
        rank: stat?.rank ?? null
      };
    });
  });

  return map;
}

function pickStat(stats, candidates) {
  for (const key of candidates) {
    if (stats?.[key]) return stats[key];
  }
  return null;
}

function buildTeamStatView(payload) {
  const stats = flattenStats(payload);

  const get = (...candidates) => pickStat(stats, candidates);

  return {
    raw: stats,
    pointsPerGame: get("pointsPerGame", "totalPointsPerGame"),
    yardsPerGame: get("netYardsPerGame", "yardsPerGame", "totalYardsPerGame"),
    passYardsPerGame: get("netPassingYardsPerGame", "passingYardsPerGame"),
    rushYardsPerGame: get("rushingYardsPerGame"),
    yardsPerPlay: get("yardsPerPlay", "netYardsPerPlay"),
    thirdDownPct: get("thirdDownPct", "thirdDownEfficiencyPct", "thirdDownPercentage"),
    redZonePct: get("redZoneEfficiencyPct", "redZonePct", "redZonePercentage"),
    turnoverDifferential: get("turnoverDifferential"),
    giveaways: get("totalGiveaways", "giveaways"),
    sacks: get("sacks", "totalSacks"),
    penalties: get("penalties", "totalPenalties"),
    penaltyYards: get("penaltyYards", "totalPenaltyYards"),
    timeOfPossession: get("averageTimeOfPossession", "timeOfPossessionPerGame"),
    firstDownsPerGame: get("firstDownsPerGame"),
    pointsAllowedPerGame: get("pointsAllowedPerGame", "opponentPointsPerGame"),
    yardsAllowedPerGame: get("yardsAllowedPerGame", "opponentYardsPerGame"),
    passYardsAllowedPerGame: get("passingYardsAllowedPerGame", "opponentPassingYardsPerGame"),
    rushYardsAllowedPerGame: get("rushingYardsAllowedPerGame", "opponentRushingYardsPerGame")
  };
}

function extractInjuries(payload) {
  const source = payload?.injuries || payload?.items || payload?.athletes || payload?.team?.injuries || [];
  const items = Array.isArray(source) ? source : [];

  return items.slice(0, 8).map((item) => ({
    name:
      item?.athlete?.displayName ||
      item?.athlete?.fullName ||
      item?.displayName ||
      item?.name ||
      "Unknown player",
    status:
      item?.status ||
      item?.type?.description ||
      item?.type?.name ||
      item?.shortComment ||
      "Injury report",
    detail:
      item?.details?.detail ||
      item?.details?.type ||
      item?.longComment ||
      item?.shortComment ||
      item?.description ||
      "",
    position:
      item?.athlete?.position?.abbreviation ||
      item?.position?.abbreviation ||
      ""
  }));
}

function weatherLabel(code) {
  const number = Number(code);

  if (number === 0) return "Clear";
  if ([1, 2].includes(number)) return "Partly cloudy";
  if (number === 3) return "Cloudy";
  if ([45, 48].includes(number)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(number)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(number)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(number)) return "Snow";
  if ([95, 96, 99].includes(number)) return "Thunderstorms";
  return "Forecast";
}

async function geocodeVenue(venue) {
  const city = venue?.address?.city;
  const state = venue?.address?.state;

  if (!city) return null;

  const params = new URLSearchParams({
    name: [city, state].filter(Boolean).join(", "),
    count: "1",
    language: "en",
    format: "json"
  });

  const payload = await fetchJson(`${OPEN_METEO_GEOCODE}?${params}`);
  return payload?.results?.[0] || null;
}

async function getWeather(eventInfo) {
  if (!eventInfo?.date || !eventInfo?.venue) return null;

  if (eventInfo.indoor) {
    return {
      indoor: true,
      condition: "Indoor / roofed venue",
      note: "Weather is unlikely to directly affect on-field conditions."
    };
  }

  const geo = await geocodeVenue(eventInfo.venue);
  if (!geo) return null;

  const kickoffMs = new Date(eventInfo.date).getTime();
  const kickoffSeconds = Math.round(kickoffMs / 1000);
  const now = Date.now();
  const sixteenDays = 16 * 24 * 60 * 60 * 1000;
  const isPast = kickoffMs < now - 6 * 60 * 60 * 1000;

  if (!isPast && kickoffMs > now + sixteenDays) {
    return {
      indoor: false,
      timezone: geo.timezone,
      unavailable: true,
      note: "Game-time forecast becomes available closer to kickoff."
    };
  }

  const day = new Date(kickoffMs).toISOString().slice(0, 10);
  const base = isPast ? OPEN_METEO_ARCHIVE : OPEN_METEO_FORECAST;
  const hourly = isPast
    ? "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m"
    : "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m";

  const params = new URLSearchParams({
    latitude: String(geo.latitude),
    longitude: String(geo.longitude),
    start_date: day,
    end_date: day,
    hourly,
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timeformat: "unixtime",
    timezone: "GMT"
  });

  const payload = await fetchJson(`${base}?${params}`);
  const times = payload?.hourly?.time || [];

  if (!times.length) return null;

  let bestIndex = 0;
  let bestDistance = Infinity;

  times.forEach((value, index) => {
    const distance = Math.abs(Number(value) - kickoffSeconds);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  const hourlyData = payload.hourly;

  return {
    indoor: false,
    historical: isPast,
    timezone: geo.timezone,
    city: geo.name,
    temperature: hourlyData.temperature_2m?.[bestIndex],
    feelsLike: hourlyData.apparent_temperature?.[bestIndex],
    precipitationProbability: hourlyData.precipitation_probability?.[bestIndex],
    precipitation: hourlyData.precipitation?.[bestIndex],
    weatherCode: hourlyData.weather_code?.[bestIndex],
    condition: weatherLabel(hourlyData.weather_code?.[bestIndex]),
    wind: hourlyData.wind_speed_10m?.[bestIndex],
    gusts: hourlyData.wind_gusts_10m?.[bestIndex]
  };
}

export async function getWeekGameContext({ season, week, away, home }) {
  const params = new URLSearchParams({
    dates: String(season),
    seasontype: "2",
    week: String(week),
    limit: "100"
  });

  const payload = await fetchJson(`${ESPN_SITE}/scoreboard?${params}`);
  const event = matchEvent(payload?.events || [], away, home);

  if (!event) return null;

  const competition = event?.competitions?.[0] || {};
  const awayCompetitor = getCompetitor(event, "away");
  const homeCompetitor = getCompetitor(event, "home");
  const venue = competition?.venue || null;
  const broadcast = competition?.broadcasts?.flatMap((item) => item?.names || []).filter(Boolean) || [];

  const eventInfo = {
    eventId: event?.id || "",
    date: event?.date || competition?.date || null,
    status: event?.status?.type?.shortDetail || event?.status?.type?.detail || "Scheduled",
    venue,
    venueName: venue?.fullName || "Venue TBD",
    city: venue?.address?.city || "",
    state: venue?.address?.state || "",
    indoor: Boolean(venue?.indoor),
    broadcast,
    awayRecord: recordSummary(awayCompetitor),
    homeRecord: recordSummary(homeCompetitor)
  };

  try {
    eventInfo.weather = await getWeather(eventInfo);
  } catch {
    eventInfo.weather = null;
  }

  return eventInfo;
}

export async function getTeamSeasonStats(team, season) {
  const normalized = normalizeTeam(team);
  const teamId = TEAM_IDS[normalized];

  if (!teamId) return null;

  const url = `${ESPN_CORE}/seasons/${season}/types/2/teams/${teamId}/statistics`;
  const payload = await fetchJson(url);

  return buildTeamStatView(payload);
}

export async function getTeamInjuries(team) {
  const normalized = normalizeTeam(team).toLowerCase();

  try {
    const payload = await fetchJson(`${ESPN_SITE}/teams/${normalized}/injuries`);
    return extractInjuries(payload);
  } catch {
    return [];
  }
}

export function formatStat(stat) {
  if (!stat) return "—";
  return stat.displayValue ?? String(stat.value ?? "—");
}
