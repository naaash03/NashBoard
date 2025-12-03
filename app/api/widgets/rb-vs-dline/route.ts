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

function buildProjection(): Projection {
  // Super simple mock logic
  const recentYards = [76, 89, 64, 102];
  const avg = recentYards.reduce((a, b) => a + b, 0) / recentYards.length;
  const defenseRushRank = 27; // bad run defense
  const bump = defenseRushRank > 20 ? 10 : 0;

  const low = Math.round(avg + bump - 10);
  const high = Math.round(avg + bump + 10);

  return {
    playerName: "Saquon Barkley",
    team: "Giants",
    opponent: "Commanders",
    projectedRange: [low, high],
    confidence: "MEDIUM",
    explanation:
      "Projection based on last 4 games and opponent’s bottom-tier rush defense.",
    recentYards,
    defenseRushRank,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") as "BEGINNER" | "ADVANCED" | null) ?? "BEGINNER";

  const proj = buildProjection();

  return NextResponse.json({ projection: proj, mode });
}
