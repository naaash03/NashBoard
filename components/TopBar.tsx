// components/TopBar.tsx
"use client";

import type { ViewMode } from "./Sidebar";

interface TopBarProps {
  mode: ViewMode;
}

export function TopBar({ mode }: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 md:px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight md:text-xl">
          My NashBoard
        </h1>
        <p className="text-xs text-slate-400 md:text-sm">
          Multi-sport snapshot ·{" "}
          {mode === "beginner"
            ? "guided analytics for newer fans"
            : "deeper metrics & matchup context"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Live games: <span className="font-semibold">3</span>
        </div>
        <button className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800">
          Edit layout
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold">
          AN
        </div>
      </div>
    </header>
  );
}
