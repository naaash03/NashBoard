// app/api/widgets/player-card/route.ts
import { NextResponse } from "next/server";

type Sport = "NFL" | "NBA" | "MLB";

type PlayerCardData = {
  id: string;
  name: string;
  team: string;
  position?: string;
  sport: Sport;
  headlineStat: string;
  headlineValue: string;
  secondaryStat?: string;
  secondaryValue?: string;
  recentGames: { label: string; value: number }[];
};

function mockPlayer(playerId: string | null, sport: Sport): PlayerCardData {
  // For now we ignore playerId and just return a “star” for the given sport
  if (sport === "NFL") {
    return {
      id: "nfl_player_1",
      name: "Saquon Barkley",
      team: "Giants",
      position: "RB",
      sport,
      headlineStat: "Rush Yards / Game",
      headlineValue: "82.4",
      secondaryStat: "Targets / Game",
      secondaryValue: "4.3",
      recentGames: [
        { label: "W12", value: 95 },
        { label: "W11", value: 71 },
        { label: "W10", value: 63 },
        { label: "W9", value: 102 },
      ],
    };
  }
  if (sport === "NBA") {
    return {
      id: "nba_player_1",
      name: "LeBron James",
      team: "Lakers",
      position: "F",
      sport,
      headlineStat: "Points / Game",
      headlineValue: "27.1",
      secondaryStat: "Assists / Game",
      secondaryValue: "7.2",
      recentGames: [
        { label: "G4", value: 31 },
        { label: "G3", value: 24 },
        { label: "G2", value: 29 },
        { label: "G1", value: 34 },
      ],
    };
  }
  // MLB
  return {
    id: "mlb_player_1",
    name: "Aaron Judge",
    team: "Yankees",
    position: "OF",
    sport,
    headlineStat: "HR",
    headlineValue: "45",
    secondaryStat: "OPS",
    secondaryValue: ".985",
    recentGames: [
      { label: "G4", value: 1 },
      { label: "G3", value: 0 },
      { label: "G2", value: 2 },
      { label: "G1", value: 1 },
    ],
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = (searchParams.get("sport") as Sport | null) ?? "NFL";
  const playerId = searchParams.get("playerId");
  const mode = (searchParams.get("mode") as "BEGINNER" | "ADVANCED" | null) ?? "BEGINNER";

  const data = mockPlayer(playerId, sport);
  return NextResponse.json({ player: data, mode });
}
