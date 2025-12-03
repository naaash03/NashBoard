// components/dashboard/DashboardPage.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import WidgetLibrary from "@/components/widgets/WidgetLibrary";

type Sport = "NFL" | "NBA" | "MLB";

type Dashboard = {
  id: string;
  title: string;
  sport: Sport;
  mode: "BEGINNER" | "ADVANCED";
};

type DashboardWidget = {
  id: string;
  widgetKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  settings: Record<string, unknown> | null;
};

export default function DashboardPage() {
  const [sport, setSport] = useState<Sport>("NFL");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [savingMode, setSavingMode] = useState(false);

  const loadDashboard = useCallback(async (selectedSport: Sport) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?sport=${selectedSport}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setDashboard(data.dashboard);
      setWidgets(data.widgets);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(sport);
  }, [sport, loadDashboard]);

  async function handleAddWidget(widgetKey: string) {
    if (!dashboard) return;
    setLoadingAdd(true);
    try {
      await fetch("/api/dashboard/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetKey, sport }),
      });
      // Reload dashboard to get new widgets
      await loadDashboard(sport);
    } finally {
      setLoadingAdd(false);
    }
  }

  async function handleChangeMode(nextMode: "BEGINNER" | "ADVANCED") {
    if (!dashboard) return;
    if (dashboard.mode === nextMode) return;
    setSavingMode(true);

    // Optimistic update
    setDashboard((prev) => (prev ? { ...prev, mode: nextMode } : prev));

    try {
      const res = await fetch("/api/dashboard/mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport, mode: nextMode }),
      });

      if (!res.ok) {
        throw new Error(`Mode update failed: ${res.statusText}`);
      }

      // Re-sync with server to ensure we have the persisted value
      await loadDashboard(sport);
    } catch (err) {
      console.error("Failed to update mode", err);
      // Optional: reload to revert optimistic update if server failed
      await loadDashboard(sport);
    } finally {
      setSavingMode(false);
    }
  }

  const modeLabel =
    dashboard?.mode === "ADVANCED" ? "Advanced Mode" : "Beginner Mode";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">NashBoard</h1>
          <p className="text-xs text-neutral-400">
            {dashboard?.title ?? "Loading dashboard…"} · {modeLabel}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Mode toggle */}
          <div className="flex gap-2 text-xs border border-neutral-700 rounded-full px-1 py-1 bg-neutral-900">
            <button
              onClick={() => handleChangeMode("BEGINNER")}
              disabled={savingMode}
              className={`px-3 py-1 rounded-full ${
                dashboard?.mode === "BEGINNER"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-300"
              }`}
            >
              Beginner
            </button>
            <button
              onClick={() => handleChangeMode("ADVANCED")}
              disabled={savingMode}
              className={`px-3 py-1 rounded-full ${
                dashboard?.mode === "ADVANCED"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-300"
              }`}
            >
              Advanced
            </button>
          </div>

          {/* Sport switcher */}
          <div className="flex gap-2 text-xs">
            {(["NFL", "NBA", "MLB"] as Sport[]).map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-3 py-1 rounded-full border ${
                  sport === s
                    ? "border-blue-400 bg-blue-500/20"
                    : "border-neutral-700 bg-neutral-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main layout: left = dashboard, right = widget library */}
      <div className="flex flex-1 overflow-hidden">
        {/* Dashboard area */}
        <section className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div>Loading dashboard…</div>
          ) : (
            <>
              {widgets.length === 0 ? (
                <div className="text-sm text-neutral-400 border border-dashed border-neutral-700 rounded-xl p-6">
                  Your {sport} dashboard is currently empty.
                  <br />
                  Use the Widget Library on the right to add your first widget.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {widgets.map((w) => (
                    <div
                      key={w.id}
                      className="border border-neutral-800 bg-neutral-900 rounded-xl p-3 text-sm"
                    >
                      <p className="font-semibold mb-1">
                        Widget: <span className="font-mono">{w.widgetKey}</span>
                      </p>
                      <p className="text-xs text-neutral-400">
                        (Placeholder content – real widget rendering will be
                        wired in the next section.)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Widget Library */}
        <aside className="w-80 border-l border-neutral-800 bg-neutral-950 overflow-y-auto">
          <WidgetLibrary sport={sport} onAddWidget={handleAddWidget} />
          {loadingAdd && (
            <p className="px-4 pb-4 text-xs text-neutral-400">
              Adding widget…
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
