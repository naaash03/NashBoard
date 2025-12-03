"use client";

import { useEffect, useState } from "react";

type Sport = "NFL" | "NBA" | "MLB";

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

type Props = {
  sport: Sport;
  mode: "BEGINNER" | "ADVANCED";
};

export default function RbVsDlineWidget({ sport, mode }: Props) {
  const [projection, setProjection] = useState<Projection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/widgets/rb-vs-dline?mode=${mode}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error(`Request failed with ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setProjection(data.projection);
        }
      } catch (err) {
        console.error("Failed to load RB vs Defense metric", err);
        if (!cancelled) {
          setError("Failed to load RB vs Defense metric.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [mode, sport]);

  if (loading) {
    return <div className="text-sm">Loading RB vs defense metric...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>;
  }

  if (!projection) {
    return (
      <div className="text-sm text-neutral-400">
        No projection available right now.
      </div>
    );
  }

  const [low, high] = projection.projectedRange;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-medium">{projection.playerName}</p>
          <p className="text-xs text-neutral-400">
            {projection.team} vs {projection.opponent} ({sport})
          </p>
        </div>
        <div className="text-right text-xs text-neutral-300">
          <p className="font-semibold">
            {Math.round(low)}–{Math.round(high)} yds
          </p>
          <p className="text-[10px] text-neutral-400">
            Projected rushing yards
          </p>
        </div>
      </div>

      <div className="text-xs text-neutral-300">
        <span className="font-semibold">Confidence: </span>
        <span>{projection.confidence}</span>
      </div>

      <p className="text-xs text-neutral-400">{projection.explanation}</p>

      {mode === "ADVANCED" && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-neutral-300">
            Defense rush rank: {projection.defenseRushRank} of 32{" "}
            <span className="text-neutral-500">(higher = softer matchup)</span>
          </p>

          <div>
            <p className="mb-1 text-xs text-neutral-300">
              Recent rushing yards
            </p>
            <div className="flex items-end gap-2">
              {projection.recentYards.map((yards, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className="w-6 rounded-t-sm bg-neutral-600"
                    style={{ height: `${Math.max(8, yards / 3)}px` }}
                  />
                  <span className="mt-1 text-[10px] text-neutral-400">
                    G{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
