// components/PlayerWatchlist.tsx
"use client";

import { useEffect, useState } from "react";
import type { ViewMode } from "./Sidebar";

type WatchlistItem = {
  id: string;
  name: string;
  team: string;
  position: string;
  note: string;
};

interface PlayerWatchlistProps {
  mode: ViewMode;
}

export function PlayerWatchlist({ mode }: PlayerWatchlistProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // simple form state
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [position, setPosition] = useState("");
  const [note, setNote] = useState("");

  const isBeginner = mode === "beginner";

  // Load watchlist from API on mount
  useEffect(() => {
    async function fetchWatchlist() {
      try {
        setLoading(true);
        const res = await fetch("/api/watchlist");
        if (!res.ok) throw new Error("Failed to load watchlist");
        const data: WatchlistItem[] = await res.json();
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchWatchlist();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !team || !position) return;

    try {
      setSaving(true);
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, team, position, note }),
      });

      if (!res.ok) {
        console.error("Failed to save watchlist item");
        return;
      }

      const created: WatchlistItem = await res.json();
      setItems((prev) => [created, ...prev]);

      // reset form
      setName("");
      setTeam("");
      setPosition("");
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="mb-2 text-sm font-semibold tracking-tight text-slate-100 md:text-base">
        Player watchlist
      </h2>

      <p className="mb-3 text-[11px] text-slate-400">
        {isBeginner
          ? "Add players you care about and jot down why they matter for tonight’s games."
          : "Use this list to track players your models care about—later this will show split stats and matchup flags."}
      </p>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="mb-3 grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4"
      >
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
          placeholder="Player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
          placeholder="Team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1"
          placeholder="Pos (QB, RB, SF...)"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 md:col-span-2"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="col-span-2 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60 md:col-span-1"
        >
          {saving ? "Saving..." : "Add to watchlist"}
        </button>
      </form>

      {/* Items */}
      {loading ? (
        <p className="text-[11px] text-slate-400">Loading watchlist…</p>
      ) : items.length === 0 ? (
        <p className="text-[11px] text-slate-400">
          No players yet. Add a few to get started.
        </p>
      ) : (
        <ul className="space-y-2 text-xs">
          {items.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-50">{p.name}</span>
                <span className="text-[11px] text-slate-400">
                  {p.team} · {p.position}
                </span>
              </div>
              {p.note && (
                <p className="mt-1 text-[11px] text-slate-400">{p.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
