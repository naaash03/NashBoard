// components/BuildSteps.tsx
"use client";

import type { ViewMode } from "./Sidebar";

interface BuildStepsProps {
  mode: ViewMode;
}

export function BuildSteps({ mode }: BuildStepsProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs">
      <h2 className="mb-2 text-sm font-semibold tracking-tight text-slate-100 md:text-base">
        Next steps for this build
      </h2>
      <ol className="list-decimal space-y-1 pl-4 text-slate-300">
        <li>Hook one widget to a real sports API (UFR-03, UFR-04, SFR-02).</li>
        <li>
          Shape API responses differently for{" "}
          <span className="font-semibold">Beginner vs Advanced</span> (SFR-23).
        </li>
        <li>
          Add database + Prisma to persist favorites/watchlist and layouts (UFR-05, UFR-08, SFR-01,
          SFR-14).
        </li>
      </ol>
      {mode === "beginner" && (
        <p className="mt-2 text-[11px] text-slate-400">
          In Beginner Mode, we keep the roadmap focused on the basics: live data, explanations, and
          a simple watchlist.
        </p>
      )}
    </div>
  );
}
