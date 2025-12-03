import "server-only";
import {
  SlateGame,
  buildApiSportsHeaders,
  ApiSportsResponse,
  getApiSportsTimezone,
  getApiSportsDate,
} from "./shared";

const MOCK_NBA_SLATE: SlateGame[] = [
  {
    id: "atl-lac",
    homeTeam: "Atlanta Hawks",
    awayTeam: "Los Angeles Clippers",
    startTime: new Date().toISOString(),
    venue: "State Farm Arena",
    league: "NBA",
  },
  {
    id: "nyk-cha",
    homeTeam: "New York Knicks",
    awayTeam: "Charlotte Hornets",
    startTime: new Date().toISOString(),
    venue: "Madison Square Garden",
    league: "NBA",
  },
  {
    id: "orl-sas",
    homeTeam: "Orlando Magic",
    awayTeam: "San Antonio Spurs",
    startTime: new Date().toISOString(),
    venue: "Kia Center",
    league: "NBA",
  },
  {
    id: "hou-sac",
    homeTeam: "Houston Rockets",
    awayTeam: "Sacramento Kings",
    startTime: new Date().toISOString(),
    venue: "Toyota Center",
    league: "NBA",
  },
  {
    id: "dal-mia",
    homeTeam: "Dallas Mavericks",
    awayTeam: "Miami Heat",
    startTime: new Date().toISOString(),
    venue: "American Airlines Center",
    league: "NBA",
  },
  {
    id: "chi-bkn",
    homeTeam: "Chicago Bulls",
    awayTeam: "Brooklyn Nets",
    startTime: new Date().toISOString(),
    venue: "United Center",
    league: "NBA",
  },
  {
    id: "cle-por",
    homeTeam: "Cleveland Cavaliers",
    awayTeam: "Portland Trail Blazers",
    startTime: new Date().toISOString(),
    venue: "Rocket Mortgage FieldHouse",
    league: "NBA",
  },
  {
    id: "mil-det",
    homeTeam: "Milwaukee Bucks",
    awayTeam: "Detroit Pistons",
    startTime: new Date().toISOString(),
    venue: "Fiserv Forum",
    league: "NBA",
  },
  {
    id: "ind-den",
    homeTeam: "Indiana Pacers",
    awayTeam: "Denver Nuggets",
    startTime: new Date().toISOString(),
    venue: "Gainbridge Fieldhouse",
    league: "NBA",
  },
];

type ProviderGame = {
  id?: string | number;
  gameId?: string | number;
  teams?: {
    home?: { name?: string; nickname?: string };
    away?: { name?: string; nickname?: string };
    visitors?: { name?: string; nickname?: string };
  };
  home_team?: { name?: string };
  visitor_team?: { name?: string };
  date?: { start?: string; timestamp?: number } | string;
  arena?: { name?: string };
  venue?: { name?: string };
  league?: { name?: string };
};

function normalizeNbaStartTime(date: ProviderGame["date"]): string {
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

export async function fetchTonightNbaSlate(): Promise<SlateGame[]> {
  const baseUrl =
    process.env.SPORTS_API_NBA_BASE_URL ?? "https://v2.nba.api-sports.io";

  let headers: HeadersInit;
  try {
    headers = buildApiSportsHeaders();
  } catch (err) {
    console.error("[NBA] API-Sports headers error:", err);
    return MOCK_NBA_SLATE;
  }

  // Abort and use mock slate if league or season are missing.
  if (!process.env.NBA_LEAGUE_ID || !process.env.NBA_SEASON) {
    console.warn("[NBA] Missing NBA_LEAGUE_ID or NBA_SEASON in .env – using mock slate.");
    return MOCK_NBA_SLATE;
  }

  const timezone = getApiSportsTimezone();
  const dateParam = getApiSportsDate(timezone);
  const params = new URLSearchParams({ date: dateParam, timezone });

  if (process.env.NBA_LEAGUE_ID) {
    params.append("league", process.env.NBA_LEAGUE_ID);
  }
  if (process.env.NBA_SEASON) {
    params.append("season", process.env.NBA_SEASON);
  }

  const url = `${baseUrl}/games?${params.toString()}`;

  try {
    const res = await fetch(url, { headers, cache: "no-store" });

    if (!res.ok) {
      console.error(
        "[NBA] API-Sports response error:",
        res.status,
        await res.text()
      );
      return MOCK_NBA_SLATE;
    }

    const json = (await res.json()) as ApiSportsResponse<ProviderGame>;
    const raw = json.response ?? json.data ?? [];
    const data: ProviderGame[] = raw;

    const games: SlateGame[] = data.map((g, idx) => {
      const homeTeam =
        g.teams?.home?.name ??
        g.teams?.home?.nickname ??
        g.home_team?.name ??
        "Home";
      const awayTeam =
        g.teams?.visitors?.name ??
        g.teams?.away?.name ??
        g.visitor_team?.name ??
        "Away";

      const startTime = normalizeNbaStartTime(g.date);

      const venue =
        g.arena?.name ??
        g.venue?.name ??
        g.league?.name ??
        undefined;

      return {
        id: String(g.id ?? g.gameId ?? `nba-${idx}`),
        homeTeam,
        awayTeam,
        startTime,
        venue,
        league: "NBA",
      };
    });

    if (!games.length) {
      return MOCK_NBA_SLATE;
    }

    return games;
  } catch (err) {
    console.error("[NBA] Error fetching slate from API-Sports:", err);
    return MOCK_NBA_SLATE;
  }
}
