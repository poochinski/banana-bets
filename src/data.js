export const demoDashboard = {
  season: 2026,
  week: 1,
  lastUpdated: "Demo data",
  metrics: {
    roi: "+12.4%",
    winRate: "58.3%",
    gamesAnalyzed: "1,287",
    recentRecord: "7–3"
  },
  games: [
    { id: "DAL-PHI", date: "Thu 9/10", away: "DAL", home: "PHI", marketSpread: "PHI -6.5", modelSpread: "PHI -7.8", total: "47.5", moneyline: "PHI -250", winProb: 72, edge: 8.1, ev: 6.4, pick: "PHI -6.5", confidence: 82 },
    { id: "MIA-LV", date: "Sun 9/13", away: "MIA", home: "LV", marketSpread: "LV -2.5", modelSpread: "MIA -1.0", total: "44.0", moneyline: "LV -140", winProb: 58, edge: 4.3, ev: 3.1, pick: "Watch", confidence: 61 },
    { id: "SF-LA", date: "Sun 9/13", away: "SF", home: "LA", marketSpread: "LA -1.5", modelSpread: "LA -2.0", total: "46.0", moneyline: "LA -130", winProb: 56, edge: 2.1, ev: 1.0, pick: "Pass", confidence: 48 },
    { id: "BAL-IND", date: "Sun 9/13", away: "BAL", home: "IND", marketSpread: "BAL -3.0", modelSpread: "BAL -4.4", total: "45.5", moneyline: "BAL -160", winProb: 63, edge: 5.7, ev: 4.8, pick: "BAL -3.0", confidence: 74 },
    { id: "KC-DEN", date: "Sun 9/13", away: "KC", home: "DEN", marketSpread: "KC -4.5", modelSpread: "KC -5.7", total: "47.0", moneyline: "KC -200", winProb: 67, edge: 6.9, ev: 5.6, pick: "KC -4.5", confidence: 79 },
    { id: "BUF-NYJ", date: "Mon 9/14", away: "NYJ", home: "BUF", marketSpread: "BUF -7.0", modelSpread: "BUF -8.3", total: "48.5", moneyline: "BUF -300", winProb: 74, edge: 9.2, ev: 7.1, pick: "BUF -7.0", confidence: 86 }
  ],
  angles: [
    { label: "Home favorites", value: "62%", detail: "historical hit rate" },
    { label: "Divisional unders", value: "64%", detail: "historical hit rate" },
    { label: "Short-rest fade", value: "71%", detail: "historical hit rate" },
    { label: "Top-10 offense vs bottom-10 defense", value: "67%", detail: "historical hit rate" }
  ],
  modelComponents: [
    { label: "Power", value: 25 },
    { label: "Recent Form", value: 20 },
    { label: "Elo", value: 20 },
    { label: "Matchup", value: 20 },
    { label: "Market", value: 15 }
  ]
};
