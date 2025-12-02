// app/page.tsx

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { TonightSlate } from "@/components/TonightSlate";
import { PlayerWatchlist } from "@/components/PlayerWatchlist";
import { BuildSteps } from "@/components/BuildSteps";
import prisma from "@/lib/prisma";

export default async function Home() {
  const DEMO_EMAIL = "demo@nashboard.local";

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      displayName: "Demo User",
      modePreference: "BEGINNER",
    },
  });

  const watchlistCount = await prisma.watchlistItem.count({
    where: { userId: demoUser.id },
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        <TopBar watchlistCount={watchlistCount} />

        {/* Filters + summary cards */}
        <section className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2 text-xs">
              <button className="rounded-full bg-slate-800 px-3 py-1 text-slate-100">
                Today
              </button>
              <button className="rounded-full bg-slate-900 px-3 py-1 text-slate-300 hover:bg-slate-800">
                Next 7 days
              </button>
              <button className="rounded-full bg-slate-900 px-3 py-1 text-slate-300 hover:bg-slate-800">
                Primetime only
              </button>
              <button className="rounded-full bg-slate-900 px-3 py-1 text-slate-300 hover:bg-slate-800">
                My teams
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] md:text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <p className="text-slate-400">Games tracked</p>
                <p className="text-sm font-semibold text-slate-50">3</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <p className="text-slate-400">Watchlist players</p>
                <p className="text-sm font-semibold text-slate-50">
                  {watchlistCount}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <p className="text-slate-400">Model status</p>
                <p className="text-sm font-semibold text-emerald-400">
                  v0.1
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <section className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <TonightSlate />

            <div className="space-y-4">
              <PlayerWatchlist />
              <BuildSteps />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
