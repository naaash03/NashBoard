// app/api/widgets/tonights-slate/route.ts

import { NextResponse } from "next/server";

// The API-Sports key is stored in our env as SPORTS_API_KEY (aligns with lib/sports/*).
const API_SPORTS_KEY = process.env.SPORTS_API_KEY;

// --- Date helpers -----------------------------------------------------------

function getTodayParts() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { y, m, d };
}

// ISO for API-Sports, compact for ESPN (?dates=YYYYMMDD)
function getTodayIso() {
  const { y, m, d } = getTodayParts();
  return `${y}-${m}-${d}`;
}

function getTodayCompact() {
  const { y, m, d } = getTodayParts();
  return `${y}${m}${d}`;
}

// --- API-Sports (NBA) fetch -------------------------------------------------

async function fetchApiSportsNbaGames(dateIso: string) {
  // If no key configured, skip straight to ESPN fallback.
  if (!API_SPORTS_KEY) return null;

  const url = `https://v2.nba.api-sports.io/games?date=${dateIso}&timezone=America/New_York`;

  try {
    const res = await fetch(url, {
      headers: {
        "x-apisports-key": API_SPORTS_KEY,
      },
      // short cache so the widget feels "live"
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      console.error("[NBA] API-Sports response not OK:", res.status);
      return null;
    }

    const data = await res.json();

    const rawGames: any[] = data?.response ?? [];
    if (!rawGames.length) {
      console.warn("[NBA] API-Sports returned empty response for", dateIso);
      return null;
    }

    // Map into a generic game shape that the widget can use.
    const games = rawGames.map((g: any) => {
      const home =
        g.teams?.home ??
        g.home ??
        g.competitions?.[0]?.competitors?.find(
          (c: any) => c?.homeAway === "home"
        );
      const away =
        g.teams?.visitors ??
        g.away ??
        g.competitions?.[0]?.competitors?.find(
          (c: any) => c?.homeAway === "away"
        );

      return {
        id: String(g.id ?? g.gameId ?? g.fixture?.id ?? crypto.randomUUID()),
        provider: "api-sports",
        league: "NBA",
        // Widget expects "home"/"away" keys; keep homeTeam/awayTeam aliases for clarity.
        home: home?.name ?? home?.team?.shortDisplayName ?? "Home",
        away: away?.name ?? away?.team?.shortDisplayName ?? "Away",
        homeTeam: home?.name ?? home?.team?.shortDisplayName ?? "Home",
        awayTeam: away?.name ?? away?.team?.shortDisplayName ?? "Away",
        startTime: g.date?.start ?? g.date ?? g.time ?? null,
        status:
          g.status?.long ??
          g.status?.short ??
          g.status?.type?.shortDetail ??
          "SCHEDULED",
        // leave odds / extra fields optional so existing UI code can ignore them
      };
    });

    return games;
  } catch (err) {
    console.error("[NBA] API-Sports fetch error:", err);
    return null;
  }
}

// --- ESPN scoreboard fallback -----------------------------------------------

function getEspnScoreboardUrl(sport: string, dateCompact: string) {
  // sport is one of "NBA" | "NFL" | "MLB"
  if (sport === "NFL") {
    return `http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${dateCompact}`;
  }
  if (sport === "MLB") {
    return `http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateCompact}`;
  }

  // Default: NBA
  return `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateCompact}`;
}

async function fetchEspnGames(sport: string, dateCompact: string) {
  const url = getEspnScoreboardUrl(sport, dateCompact);

  try {
    const res = await fetch(url, { next: { revalidate: 15 } });

    if (!res.ok) {
      console.error("[ESPN] Scoreboard response not OK:", res.status);
      return [];
    }

    const data = await res.json();
    const events: any[] = data?.events ?? [];

    const games = events.map((ev: any) => {
      const comp = ev.competitions?.[0];
      const competitors: any[] = comp?.competitors ?? [];
      const home =
        competitors.find((c) => c.homeAway === "home") ?? competitors[0];
      const away =
        competitors.find((c) => c.homeAway === "away") ?? competitors[1];

      return {
        id: String(ev.id),
        provider: "espn",
        league: sport,
        home:
          home?.team?.shortDisplayName ??
          home?.team?.abbreviation ??
          home?.team?.name ??
          "Home",
        away:
          away?.team?.shortDisplayName ??
          away?.team?.abbreviation ??
          away?.team?.name ??
          "Away",
        homeTeam:
          home?.team?.shortDisplayName ??
          home?.team?.abbreviation ??
          home?.team?.name ??
          "Home",
        awayTeam:
          away?.team?.shortDisplayName ??
          away?.team?.abbreviation ??
          away?.team?.name ??
          "Away",
        startTime: ev.date ?? null,
        status:
          ev.status?.type?.shortDetail ??
          ev.status?.type?.description ??
          "SCHEDULED",
      };
    });

    return games;
  } catch (err) {
    console.error("[ESPN] Scoreboard fetch error:", err);
    return [];
  }
}

// --- Route handler ----------------------------------------------------------

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport =
    (searchParams.get("sport") || "NBA").toUpperCase() as "NBA" | "NFL" | "MLB";
  const mode = (searchParams.get("mode") || "BEGINNER").toUpperCase();

  const dateIso = getTodayIso();
  const dateCompact = getTodayCompact();

  try {
    let games: any[] = [];

    if (sport === "NBA") {
      // 1) Try API-Sports (if key + data available)
      const apiSportsGames = await fetchApiSportsNbaGames(dateIso);
      if (apiSportsGames && apiSportsGames.length > 0) {
        games = apiSportsGames;
      } else {
        // 2) Fallback to ESPN if API-Sports is empty or failed
        games = await fetchEspnGames("NBA", dateCompact);
      }
    } else {
      // For NFL / MLB we go straight to ESPN for now.
      games = await fetchEspnGames(sport, dateCompact);
    }

    return NextResponse.json({
      mode,
      sport,
      date: dateIso,
      games,
    });
  } catch (err) {
    console.error("[Tonight's Slate] Fatal error:", err);
    return NextResponse.json(
      {
        mode,
        sport,
        date: dateIso,
        games: [],
        error: "Failed to load tonight's slate.",
      },
      { status: 500 }
    );
  }
}
