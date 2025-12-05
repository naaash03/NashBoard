"use client";

import { useCallback, useEffect, useState } from "react";

type Sport = "NFL" | "NBA" | "MLB";

type SlateGame = {
  id: string;
  league: Sport;
  home: string;
  away: string;
  startTime: string;
  spread?: string | number;
  total?: number;
  status: "SCHEDULED" | "LIVE" | "FINAL";
};

type SlateSource = "api-sports" | "mock" | "unknown";

type SlateResponse = {
  sport: Sport;
  mode: "BEGINNER" | "ADVANCED";
  games: SlateGame[];
  source?: SlateSource;
  message?: string;
};

type Props = {
  sport: Sport;
  mode: "BEGINNER" | "ADVANCED";
};

function formatTipoff(startTime: string) {
  if (!startTime) return "Time TBD";

  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return "Time TBD";

  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TonightsSlateWidget({ sport, mode }: Props) {
  const [games, setGames] = useState<SlateGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<SlateSource>("unknown");
  const [message, setMessage] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/widgets/tonights-slate?sport=${sport}&mode=${mode}`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        console.error("Failed to load tonight's slate", res.status);
        setError("Failed to load tonight's slate.");
        setGames([]);
        setSource("unknown");
        return;
      }

      const data: SlateResponse = await res.json();
      setGames(data.games ?? []);
      setSource(data.source ?? "unknown");
      setMessage(data.message ?? null);
    } catch (err) {
      console.error("Error loading tonight's slate", err);
      setError("Failed to load tonight's slate.");
      setGames([]);
      setSource("unknown");
    } finally {
      setLoading(false);
    }
  }, [sport, mode]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const sourceLabel =
    source === "api-sports"
      ? "Live - API-SPORTS"
      : source === "mock"
      ? "Cached - Demo data"
      : "Source - Unknown";

  if (loading) {
    return (
      <div className="text-sm text-neutral-300">
        Loading tonight&apos;s games...
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-400">{error}</div>;
  }

  if (games.length === 0) {
    return (
      <div className="space-y-2 text-sm text-neutral-400">
        <div className="flex items-center justify-between">
          <span>
            No {sport} games scheduled today.
            {message ? ` ${message}` : " (off day or offseason)"}
          </span>
          <button
            onClick={fetchGames}
            className="rounded-full border border-neutral-600 px-3 py-1 text-[11px] hover:bg-neutral-800"
          >
            Refresh
          </button>
        </div>
        <p className="text-[11px] text-neutral-500">{sourceLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-xs text-neutral-400">
            {games.length} game{games.length !== 1 && "s"} scheduled
          </p>
          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-400 border border-neutral-700">
            {sourceLabel}
          </span>
        </div>
        <button
          onClick={fetchGames}
          className="rounded-full border border-neutral-600 px-3 py-1 text-[11px] hover:bg-neutral-800"
        >
          Refresh
        </button>
      </div>
      {message && (
        <p className="text-[11px] text-neutral-400">{message}</p>
      )}

      {games.map((g) => (
        <div
          key={g.id}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase text-neutral-400">
                    AWAY
                  </span>
                  <span className="text-[13px] text-neutral-100">
                    {g.away}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase text-neutral-400">
                    HOME
                  </span>
                  <span className="text-[13px] text-neutral-100">
                    {g.home}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400">
                {formatTipoff(g.startTime)} - {g.league}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase text-neutral-400">Status</p>
              <p className="text-xs font-semibold text-neutral-100">
                {g.status}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
