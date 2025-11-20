// components/TonightSlate.tsx
"use client";

import type { ViewMode } from "./Sidebar";

type Game = {
  id: number;
  league: "NFL" | "NBA" | "MLB";
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  line?: string;
};

const mockGames: Game[] = [
  { id: 1, league: "NFL", homeTeam: "Eagles", awayTeam: "Cowboys", startTime: "8:15 PM", line: "PHI -3.5" },
  { id: 2, league: "NBA", homeTeam: "Celtics", awayTeam: "Knicks", startTime: "7:30 PM", line: "BOS -6.0" },
  { id: 3, league: "NFL", homeTeam: "49ers", awayTeam: "Rams", startTime: "4:25 PM", line: "SF -4.0" },
];

interface TonightSlateProps {
  mode: ViewMode;
}

export function TonightSlate({ mode }: TonightSlateProps) {
  const isBeginner = mode === "beginner";

  return (
    <div className="lg:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100 md:text-base">
          Tonight&apos;s slate
        </h2>
        <span className="text-xs text-slate-400">
          Static data for now · API hookup later
        </span>
      </div>

      <div className="space-y-3">
        {mockGames.map((game) => (
          <div
            key={game.id}
            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 md:flex-row md:items-center md:px-4"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {game.league}
              </span>
              <span className="text-sm font-semibold text-slate-50 md:text-base">
                {game.awayTeam} @ {game.homeTeam}
              </span>
              <span className="text-xs text-slate-400">
                Kickoff · {game.startTime}
              </span>
            </div>

            <div className="flex flex-col items-start gap-1 text-xs md:items-end">
              <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-200">
                Line: {game.line ?? "TBD"}
              </span>

              {isBeginner ? (
                <span className="text-[11px] text-slate-400">
                  Beginner view: keep an eye on{" "}
                  <span className="font-medium">QB vs defense</span> and{" "}
                  <span className="font-medium">RB vs front-7</span> for this game.
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Advanced view: plug in{" "}
                  <span className="font-medium">pressure rate, rush EPA, yards after contact</span>{" "}
                  once metrics engine is wired (SFR-21). {/* spec tie-in */}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
