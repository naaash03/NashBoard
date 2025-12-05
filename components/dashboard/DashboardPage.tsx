// components/dashboard/DashboardPage.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import WidgetLibrary from "@/components/widgets/WidgetLibrary";
import TonightsSlateWidget from "@/components/widgets/TonightsSlateWidget";
import PlayerCardWidget from "@/components/widgets/PlayerCardWidget";
import WatchlistWidget from "@/components/widgets/WatchlistWidget";
import RbVsDlineWidget from "@/components/widgets/RbVsDlineWidget";
import TopBarAuth from "@/components/TopBarAuth";

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

type WidgetMode = "BEGINNER" | "ADVANCED";

type WidgetComponentProps = {
  sport: Sport;
  mode: WidgetMode;
};

const WIDGET_COMPONENTS: Record<
  string,
  (props: WidgetComponentProps) => JSX.Element | null
> = {
  tonights_slate: (props) => <TonightsSlateWidget {...props} />,
  player_card: (props) => <PlayerCardWidget {...props} />,
  watchlist: (props) => <WatchlistWidget sport={props.sport} mode={props.mode} />,
  rb_vs_dline: (props) => <RbVsDlineWidget {...props} />,
};

export default function DashboardPage() {
  const [sport, setSport] = useState<Sport>("NFL");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef(0);

  const loadDashboard = useCallback(
    async (nextSport: Sport) => {
      const requestId = ++loadRequestRef.current;
      setLoading(true);
      setError(null);

      try {
        const [dashboardRes, widgetsRes] = await Promise.all([
          fetch(`/api/dashboard?sport=${nextSport}`),
          fetch(`/api/dashboard/widgets?sport=${nextSport}`),
        ]);

        if (!dashboardRes.ok || !widgetsRes.ok) {
          const dashText = !dashboardRes.ok ? await dashboardRes.text() : "";
          const widgetsText = !widgetsRes.ok ? await widgetsRes.text() : "";
          console.error("Failed to load dashboard/widgets", {
            dashboardStatus: dashboardRes.status,
            widgetsStatus: widgetsRes.status,
            dashText,
            widgetsText,
          });
          if (requestId === loadRequestRef.current) {
            setDashboard(null);
            setWidgets([]);
            setError("Could not load dashboard data.");
          }
          return;
        }

        const [dashboardData, widgetsData] = await Promise.all([
          dashboardRes.json(),
          widgetsRes.json(),
        ]);

        if (requestId !== loadRequestRef.current) {
          return;
        }

        setDashboard(dashboardData.dashboard);
        setWidgets(widgetsData.widgets);
      } catch (err) {
        console.error("Error in loadDashboard", err);
        if (requestId === loadRequestRef.current) {
          setError("Failed to load dashboard. Please try again.");
          setDashboard(null);
          setWidgets([]);
        }
      } finally {
        if (requestId === loadRequestRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard(sport);
  }, [sport, loadDashboard]);

  async function handleAddWidget(widgetKey: string) {
    if (!sport) return;

    setError(null);
    setLoadingAdd(true);

    try {
      const res = await fetch("/api/dashboard/widgets", {
        method: "POST",
        body: JSON.stringify({ sport, widgetKey }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.error("Failed to add widget", await res.text());
        setError("Could not add widget. Please try again.");
        return;
      }

      await loadDashboard(sport);
    } catch (err) {
      console.error("Error adding widget", err);
      setError("Could not add widget. Please try again.");
    } finally {
      setLoadingAdd(false);
    }
  }

  async function handleRemoveWidget(widgetId: string) {
    if (!widgetId) {
      console.error("No widget id provided for delete");
      return;
    }
    // Optimistically remove from UI
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));

    try {
      const res = await fetch(`/api/dashboard/widgets/${widgetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to delete widget", await res.text());
        // Reload to reconcile if something went wrong
        await loadDashboard(sport);
      }
    } catch (err) {
      console.error("Failed to delete widget", err);
      // Reload to keep client/server state in sync
      await loadDashboard(sport);
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

  const currentMode: WidgetMode = dashboard?.mode ?? "BEGINNER";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">NashBoard</h1>
          <p className="text-xs text-neutral-400">
            {dashboard?.title ?? "Loading dashboard..."} - {modeLabel}
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

          <TopBarAuth />
        </div>
      </header>

      {/* Main layout: left = dashboard, right = widget library */}
      <div className="flex flex-1 overflow-hidden">
        {/* Dashboard area */}
        <section className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div>Loading dashboard...</div>
          ) : (
            <>
              {error && (
                <div className="mb-3 rounded-md border border-red-500 bg-red-950 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              )}
              {widgets.length === 0 ? (
                <div className="text-sm text-neutral-400 border border-dashed border-neutral-700 rounded-xl p-6">
                  Your {sport} dashboard is currently empty.
                  <br />
                  Use the Widget Library on the right to add your first widget.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {widgets.map((w) => {
                    const WidgetComponent = WIDGET_COMPONENTS[w.widgetKey];

                    // Simple human-readable label from the key
                    const label = w.widgetKey.replace(/_/g, " ");

                    return (
                      <div
                        key={w.id}
                        className="border border-neutral-800 bg-neutral-900 rounded-xl p-3 text-sm"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-semibold text-xs capitalize">{label}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveWidget(w.id)}
                            className="rounded-full px-2 text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                            aria-label="Remove widget"
                          >
                            A-
                          </button>
                        </div>

                        {WidgetComponent ? (
                          <WidgetComponent sport={sport} mode={currentMode} />
                        ) : (
                          <>
                            <p className="text-xs text-neutral-400">
                              This widget type has not been wired up yet.
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
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
              Adding widget...
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
