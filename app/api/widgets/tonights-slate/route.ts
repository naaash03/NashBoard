// app/api/widgets/tonights-slate/route.ts
import { NextResponse } from "next/server";

type Sport = "NFL" | "NBA" | "MLB";

type SlateGame = {
  id: string;
  league: Sport;
  home: string;
  away: string;
  startTime: string;
  spread?: string;
  total?: number;
  status: "SCHEDULED" | "LIVE" | "FINAL";
};

function getMockSlate(sport: Sport): SlateGame[] {
  const now = new Date();
  if (sport === "NFL") {
    return [
      {
        id: "nfl1",
        league: "NFL",
        home: "Eagles",
        away: "Cowboys",
        startTime: now.toISOString(),
        spread: "-2.5 PHI",
        total: 48.5,
        status: "SCHEDULED",
      },
      {
        id: "nfl2",
        league: "NFL",
        home: "Chiefs",
        away: "Bills",
        startTime: now.toISOString(),
        spread: "-3.0 KC",
        total: 52.5,
        status: "SCHEDULED",
      },
    ];
  }
  if (sport === "NBA") {
    return [
      {
        id: "nba1",
        league: "NBA",
        home: "Lakers",
        away: "Warriors",
        startTime: now.toISOString(),
        total: 232.5,
        status: "SCHEDULED",
      },
      {
        id: "nba2",
        league: "NBA",
        home: "Celtics",
        away: "Bucks",
        startTime: now.toISOString(),
        total: 226.5,
        status: "SCHEDULED",
      },
    ];
  }
  // MLB
  return [
    {
      id: "mlb1",
      league: "MLB",
      home: "Yankees",
      away: "Red Sox",
      startTime: now.toISOString(),
      total: 8.5,
      status: "SCHEDULED",
    },
  ];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sportParam = (searchParams.get("sport") as Sport | null) ?? "NFL";
  const mode = (searchParams.get("mode") as "BEGINNER" | "ADVANCED" | null) ?? "BEGINNER";

  const games = getMockSlate(sportParam);

  // You *could* trim data here for BEGINNER vs ADVANCED,
  // but for now we'll just send everything and let the widget decide.
  return NextResponse.json({ games, mode, sport: sportParam });
}
