import { NextResponse } from "next/server";
import type { Sport, SlateGame } from "@/lib/sports/shared";
import { fetchTonightNbaSlate } from "@/lib/sports/nba";
import { fetchTonightNflSlate } from "@/lib/sports/nfl";
import { fetchTonightMlbSlate } from "@/lib/sports/mlb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sportParam = (searchParams.get("sport") ?? "NFL") as Sport;
  const mode = searchParams.get("mode") ?? "BEGINNER";

  try {
    let games: SlateGame[] = [];
    let source: "api-sports" | "mock" = "api-sports";

    if (sportParam === "NBA") {
      games = await fetchTonightNbaSlate();
    } else if (sportParam === "NFL") {
      games = await fetchTonightNflSlate();
    } else {
      games = await fetchTonightMlbSlate();
    }

    // Our fetch functions already fall back to mock data if the API fails.
    // Detect that based on ids beginning with "mock-" as a simple heuristic.
    if (Array.isArray(games) && games.some((g) => g.id.startsWith("mock-"))) {
      source = "mock";
    }

    // Normalize to widget-friendly shape
    const normalized = games.map((g) => ({
      id: g.id,
      league: g.league,
      home: (g as SlateGame & { home?: string }).home ?? g.homeTeam ?? "Home",
      away: (g as SlateGame & { away?: string }).away ?? g.awayTeam ?? "Away",
      startTime: g.startTime,
      spread: (g as { spread?: string | number }).spread,
      total: (g as { total?: number }).total,
      status: (g as { status?: string }).status ?? "SCHEDULED",
    }));

    return NextResponse.json({
      sport: sportParam,
      mode,
      games: normalized,
      source,
    });
  } catch (err) {
    console.error("Error in tonights-slate route:", err);
    return NextResponse.json(
      { error: "Failed to load tonight's slate" },
      { status: 500 }
    );
  }
}
