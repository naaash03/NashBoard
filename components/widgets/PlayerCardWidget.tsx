"use client";

import { useEffect, useState } from "react";

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

export default function PlayerCardWidget({
  sport,
  mode,
}: {
  sport: Sport;
  mode: "BEGINNER" | "ADVANCED";
}) {
  const [data, setData] = useState<PlayerCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(
        `/api/widgets/player-card?sport=${sport}&mode=${mode}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setData(json.player);
      setLoading(false);
    }
    load();
  }, [sport, mode]);

  if (loading || !data) return <div className="text-sm">Loading player…</div>;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">
            {data.name}
            {data.position ? ` · ${data.position}` : ""}
          </p>
          <p className="text-xs text-neutral-400">
            {data.team} · {data.sport}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="text-2xl font-bold">{data.headlineValue}</div>
        <div className="text-xs text-neutral-400 self-end mb-1">
          {data.headlineStat}
        </div>
      </div>

      {mode === "ADVANCED" && (
        <>
          {data.secondaryStat && (
            <div className="text-xs text-neutral-300">
              {data.secondaryStat}:{" "}
              <span className="font-semibold">{data.secondaryValue}</span>
            </div>
          )}

          <div className="mt-1">
            <p className="text-[11px] text-neutral-400 mb-1">
              Recent games trend:
            </p>
            <div className="flex items-end gap-2">
              {data.recentGames.map((g) => (
                <div key={g.label} className="flex flex-col items-center">
                  <div
                    className="w-6 rounded-t-sm bg-neutral-600"
                    style={{ height: `${Math.max(8, g.value / 2)}px` }}
                  />
                  <span className="text-[10px] text-neutral-400 mt-1">
                    {g.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
