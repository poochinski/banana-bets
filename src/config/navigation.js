import {
  Home,
  Gamepad2,
  Users,
  Swords,
  Layers3,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  CircleHelp,
  Settings
} from "lucide-react";

export const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: Home },
  { name: "Game Predictions", path: "/game-predictions", icon: Gamepad2 },
  { name: "Player Props", path: "/player-props", icon: Users, badge: "Soon" },
  { name: "Matchup Breakdown", path: "/matchups", icon: Swords, badge: "New" },
  { name: "Bet Builder", path: "/bet-builder", icon: Layers3, badge: "New" },
  { name: "Trends & Angles", path: "/trends", icon: TrendingUp },
  { name: "My Bets", path: "/my-bets", icon: ShieldCheck },
  { name: "Model Performance", path: "/model-performance", icon: BarChart3 },
  { name: "How Banana Works", path: "/how-it-works", icon: CircleHelp },
  { name: "Settings", path: "/settings", icon: Settings }
];

export const PAGE_TO_PATH = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.name, item.path])
);

export const PATH_TO_PAGE = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.path, item.name])
);
