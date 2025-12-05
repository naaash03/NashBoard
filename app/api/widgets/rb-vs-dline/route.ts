// app/api/widgets/rb-vs-dline/route.ts
import { NextResponse } from "next/server";

type Projection = {
  playerName: string;
  team: string;
  opponent: string;
  projectedRange: [number, number];
  confidence: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
  recentYards: number[];
  defenseRushRank: number; // 1 = best, 32 = worst
};

function buildProjection(mode: "BEGINNER" | "ADVANCED"): Projection {
  const recentYards = [76, 89, 64, 102];
  const avg = recentYards.reduce((a, b) => a + b, 0) / recentYards.length;
  const defenseRushRank = 27; // bad run defense
  const bump = defenseRushRank > 20 ? 10 : 0;

  const low = Math.round(avg + bump - (mode === "ADVANCED" ? 12 : 10));
  const high = Math.round(avg + bump + (mode === "ADVANCED" ? 12 : 10));

  return {
    playerName: "Saquon Barkley",
    team: "Giants",
    opponent: "Commanders",
    projectedRange: [low, high],
    confidence: mode === "ADVANCED" ? "HIGH" : "MEDIUM",
    explanation:
      mode === "ADVANCED"
        ? "Range blends the last 4 games, opponent rush rank, and a small confidence bump because Washington's front is allowing 5.2 YPC."
        : "Projection based on recent games and a soft opponent rush defense.",
    recentYards,
    defenseRushRank,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") as "BEGINNER" | "ADVANCED" | null) ?? "BEGINNER";

  const projection = buildProjection(mode);

  return NextResponse.json({ projection, mode });
}
