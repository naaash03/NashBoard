"use client";

import { useEffect, useState } from "react";

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

export default function TonightsSlateWidget({
  sport,
  mode,
}: {
  sport: Sport;
  mode: "BEGINNER" | "ADVANCED";
}) {
  const [games, setGames] = useState<SlateGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(
        `/api/widgets/tonights-slate?sport=${sport}&mode=${mode}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setGames(data.games);
      setLoading(false);
    }
    load();
  }, [sport, mode]);

  if (loading) return <div className="text-sm">Loading tonight&apos;s games…</div>;

  if (games.length === 0)
    return (
      <div className="text-sm text-neutral-400">
        No games found for tonight for {sport}.
      </div>
    );

  return (
    <div className="space-y-2 text-sm">
      {games.map((g) => (
        <div
          key={g.id}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">
                {g.away} @ {g.home}
              </p>
              <p className="text-xs text-neutral-400">{g.league}</p>
            </div>
            <p className="text-xs text-neutral-400">{g.status}</p>
          </div>

          {mode === "ADVANCED" && (
            <div className="mt-1 flex justify-between text-xs text-neutral-300">
              <span>Spread: {g.spread ?? "N/A"}</span>
              <span>Total: {g.total ?? "N/A"}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
