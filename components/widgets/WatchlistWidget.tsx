"use client";

import { useCallback, useEffect, useState } from "react";

type Favorite = {
  id: string;
  label: string;
  entityId: string;
  entityType: string;
  sport?: Sport;
};

type Sport = "NFL" | "NBA" | "MLB";

type Props = {
  sport?: Sport;
  mode?: "BEGINNER" | "ADVANCED";
};

export default function WatchlistWidget({ sport, mode }: Props) {
  const resolvedSport = sport ?? "NFL";
  const resolvedMode = mode ?? "BEGINNER";
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTonight, setLoadingTonight] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [tonightMatchups, setTonightMatchups] = useState<Record<string, string>>(
    {}
  );

  const hydrateTonightMatchups = useCallback(
    async (currentEntries: Favorite[]) => {
      try {
        setLoadingTonight(true);

        const res = await fetch(
          `/api/widgets/tonights-slate?sport=${resolvedSport}&mode=${resolvedMode}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          console.error("Failed to load tonight's slate for watchlist", res.status);
          setTonightMatchups({});
          return;
        }

        const data = (await res.json()) as {
          games: { home: string; away: string; startTime: string }[];
          message?: string;
        };

        const games = data.games ?? [];
        const map: Record<string, string> = {};

        for (const entry of currentEntries) {
          const name = entry.label.toLowerCase();

          if (entry.entityType !== "TEAM") {
            map[entry.id] = "Matchups are only available for teams.";
            continue;
          }

          const match = games.find(
            (g) =>
              g.home.toLowerCase().includes(name) ||
              g.away.toLowerCase().includes(name)
          );

          if (!match) {
            const trimmedName = entry.label.trim();
            const wordCount = trimmedName.split(/\s+/).filter(Boolean).length;
            const looksLikePlayer = wordCount >= 2;

            if (looksLikePlayer) {
              map[entry.id] =
                "Player entry detected; matchups are only shown for teams. Use the Player Card widget for details.";
            } else {
              map[entry.id] = `No ${resolvedSport} game today for this team (off day or offseason).`;
              if (data.message) {
                map[entry.id] = `${map[entry.id]} ${data.message}`;
              }
            }
            continue;
          }

          const isHome = match.home.toLowerCase().includes(name);
          const opponent = isHome ? match.away : match.home;

          const dt = new Date(match.startTime);
          const timeLabel = Number.isNaN(dt.getTime())
            ? "Time TBD"
            : dt.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              });

          map[entry.id] = `${isHome ? "vs" : "@"} ${opponent} - ${timeLabel}`;
        }

        setTonightMatchups(map);
      } catch (err) {
        console.error("Error hydrating watchlist matchups", err);
        setTonightMatchups({});
      } finally {
        setLoadingTonight(false);
      }
    },
    [resolvedMode, resolvedSport]
  );

  useEffect(() => {
    if (!items || items.length === 0) {
      setTonightMatchups({});
      return;
    }

    hydrateTonightMatchups(items);
  }, [items, hydrateTonightMatchups]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/watchlist?sport=${resolvedSport}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          console.error("Failed to load watchlist", res.status);
          if (!cancelled) {
            setError("Failed to load watchlist.");
            setItems([]);
          }
          return;
        }
        const data: Favorite[] | { items?: Favorite[]; favorites?: Favorite[] } =
          await res.json();
        const parsed = Array.isArray(data)
          ? data
          : data.items ?? data.favorites ?? [];
        if (!cancelled) {
          setItems(parsed);
        }
      } catch (err) {
        console.error("Watchlist load error", err);
        if (!cancelled) {
          setError("Failed to load watchlist.");
          setItems([]);
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
  }, [resolvedSport]);

  async function reloadWatchlist() {
    try {
      const res = await fetch(`/api/watchlist?sport=${resolvedSport}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        console.error("Failed to reload watchlist", res.status);
        setError("Failed to load watchlist.");
        return;
      }
      const data: Favorite[] | { items?: Favorite[]; favorites?: Favorite[] } =
        await res.json();
      const parsed = Array.isArray(data) ? data : data.items ?? data.favorites ?? [];
      setItems(parsed);
    } catch (err) {
      console.error("Error reloading watchlist", err);
      setError("Failed to load watchlist.");
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    setError(null);

    const body = {
      label: label.trim(),
      entityId: label.trim().toLowerCase().replace(/\s+/g, "-"),
      entityType: "TEAM",
      sport: resolvedSport,
    };

    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("Failed to add watchlist item", await res.text());
        setError("Could not add to watchlist.");
        return;
      }

      const newItem = await res.json();
      setItems((prev) => {
        const next = [newItem, ...prev];
        return next;
      });
      setLabel("");
    } catch (err) {
      console.error("Error adding watchlist item", err);
      setError("Could not add to watchlist.");
    }
  }

  async function removeItem(id: string) {
    setError(null);

    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });

      if (!res.ok) {
        console.error("Failed to delete watchlist item", await res.text());
        setError("Could not remove from watchlist.");
        await reloadWatchlist();
        return;
      }

      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id);
        return next;
      });
    } catch (err) {
      console.error("Error deleting watchlist item", err);
      setError("Could not remove from watchlist.");
      await reloadWatchlist();
    }
  }

  if (loading) return <div className="text-sm">Loading watchlist...</div>;

  return (
    <div className="space-y-3 text-sm">
      {error && (
        <div className="mb-2 rounded-md border border-red-500 bg-red-950 px-2 py-1 text-[10px] text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={addItem} className="flex gap-2">
        <input
          className="flex-1 rounded-lg px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-xs"
          placeholder="Add a team..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg border border-neutral-600 text-xs"
        >
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <div className="text-xs text-neutral-400">
          Your watchlist is empty. Add a team or player to track them here.
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-100">
                  {item.label}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-[11px] text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>

              <p className="mt-1 text-[11px] text-neutral-400">
                {loadingTonight
                  ? "Checking tonight's schedule..."
                  : tonightMatchups[item.id] ?? "No game info."}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
