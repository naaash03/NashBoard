import "server-only";
import {
  SlateGame,
  buildApiSportsHeaders,
  ApiSportsResponse,
  getApiSportsTimezone,
  getApiSportsDate,
} from "./shared";

const MOCK_NFL_SLATE: SlateGame[] = [
  {
    id: "mock-nfl-1",
    homeTeam: "Giants",
    awayTeam: "Eagles",
    startTime: new Date().toISOString(),
    venue: "MetLife Stadium",
    league: "NFL",
  },
];

type ProviderGame = {
  id?: string | number;
  gameId?: string | number;
  teams?: {
    home?: { name?: string; nickname?: string };
    away?: { name?: string; nickname?: string };
  };
  date?: { start?: string; timestamp?: number } | string;
  league?: { name?: string };
  game?: { venue?: string };
  venue?: { name?: string };
};

function normalizeNflStartTime(date: ProviderGame["date"]): string {
  if (typeof date === "string" && date) {
    return date;
  }

  if (date && typeof date === "object") {
    if (date.start) {
      return date.start;
    }
    if (date.timestamp) {
      return new Date(date.timestamp * 1000).toISOString();
    }
  }

  return new Date().toISOString();
}

export async function fetchTonightNflSlate(): Promise<SlateGame[]> {
  const baseUrl =
    process.env.SPORTS_API_NFL_BASE_URL ??
    "https://v1.american-football.api-sports.io";

  let headers: HeadersInit;
  try {
    headers = buildApiSportsHeaders();
  } catch (err) {
    console.error("[NFL] API-Sports headers error:", err);
    return MOCK_NFL_SLATE;
  }

  // Abort and use mock slate if league or season are missing.
  if (!process.env.NFL_LEAGUE_ID || !process.env.NFL_SEASON) {
    console.warn("[NFL] Missing NFL_LEAGUE_ID or NFL_SEASON in .env – using mock slate.");
    return MOCK_NFL_SLATE;
  }

  const timezone = getApiSportsTimezone();
  const dateParam = getApiSportsDate(timezone);
  const params = new URLSearchParams({ date: dateParam, timezone });

  if (process.env.NFL_LEAGUE_ID) {
    params.append("league", process.env.NFL_LEAGUE_ID);
  }
  if (process.env.NFL_SEASON) {
    params.append("season", process.env.NFL_SEASON);
  }

  const url = `${baseUrl}/games?${params.toString()}`;

  try {
    const res = await fetch(url, { headers, cache: "no-store" });

    if (!res.ok) {
      console.error(
        "[NFL] API-Sports response error:",
        res.status,
        await res.text()
      );
      return MOCK_NFL_SLATE;
    }

    const json = (await res.json()) as ApiSportsResponse<ProviderGame>;
    const raw = json.response ?? json.data ?? [];
    const data: ProviderGame[] = raw;

    const games: SlateGame[] = data.map((g, idx) => {
      const homeTeam =
        g.teams?.home?.name ??
        g.teams?.home?.nickname ??
        "Home";
      const awayTeam =
        g.teams?.away?.name ??
        g.teams?.away?.nickname ??
        "Away";

      const startTime = normalizeNflStartTime(g.date);

      const venue =
        g.league?.name ??
        g.game?.venue ??
        g.venue?.name ??
        undefined;

      return {
        id: String(g.id ?? g.gameId ?? `nfl-${idx}`),
        homeTeam,
        awayTeam,
        startTime,
        venue,
        league: "NFL",
      };
    });

    if (!games.length) {
      return MOCK_NFL_SLATE;
    }

    return games;
  } catch (err) {
    console.error("[NFL] Error fetching slate from API-Sports:", err);
    return MOCK_NFL_SLATE;
  }
}
