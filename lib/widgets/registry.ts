// lib/widgets/registry.ts

export type WidgetDefinition = {
  key: string;
  name: string;
  description: string;
  category: string; // e.g. "Games", "Players", "Comparisons", "Predictive"
  supportedSports: ("NFL" | "NBA" | "MLB")[];
  defaultSize: { w: number; h: number };
  hasBeginnerMode: boolean;
  hasAdvancedMode: boolean;
};

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    key: "tonights_slate",
    name: "Tonight's Games",
    description: "Displays tonight's matchups, odds, and status.",
    category: "Games",
    supportedSports: ["NFL", "NBA", "MLB"],
    defaultSize: { w: 4, h: 3 },
    hasBeginnerMode: true,
    hasAdvancedMode: true,
  },
  {
    key: "player_card",
    name: "Player Card",
    description: "Shows stats, recent performance, and trends for a player.",
    category: "Players",
    supportedSports: ["NFL", "NBA", "MLB"],
    defaultSize: { w: 3, h: 4 },
    hasBeginnerMode: true,
    hasAdvancedMode: true,
  },
  {
    key: "watchlist",
    name: "Team Watchlist",
    description: "Tracks favorite teams and shows whether they play tonight.",
    category: "Favorites",
    supportedSports: ["NFL", "NBA", "MLB"],
    defaultSize: { w: 3, h: 3 },
    hasBeginnerMode: true,
    hasAdvancedMode: true,
  },
  {
    key: "rb_vs_dline",
    name: "RB vs Defense Metric",
    description:
      "Displays a matchup-based projection for NFL RBs based on defense performance.",
    category: "Predictive",
    supportedSports: ["NFL"],
    defaultSize: { w: 4, h: 4 },
    hasBeginnerMode: true,
    hasAdvancedMode: true,
  },
];
