"use client";

import { useEffect, useState } from "react";

type Favorite = {
  id: string;
  label: string;
  entityId: string;
  entityType: string;
};

export default function WatchlistWidget() {
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/watchlist", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load watchlist (${res.status})`);
        }
        const data: Favorite[] = await res.json();
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        console.error("Watchlist load error", err);
        if (!cancelled) {
          setError("Could not load watchlist right now.");
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
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    const body = {
      label: label.trim(),
      entityId: label.trim().toLowerCase().replace(/\s+/g, "-"),
      entityType: "TEAM",
    };

    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return;
    }

    const newItem = await res.json();
    setItems((prev) => [newItem, ...prev]);
    setLabel("");
  }

  async function removeItem(id: string) {
    await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  if (loading) return <div className="text-sm">Loading watchlist...</div>;
  if (error) return <div className="text-sm text-rose-400">{error}</div>;

  return (
    <div className="space-y-3 text-sm">
      <form onSubmit={addItem} className="flex gap-2">
        <input
          className="flex-1 rounded-lg px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-xs"
          placeholder="Add a team or player..."
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
              className="flex items-center justify-between rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5"
            >
              <span>{item.label}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-[11px] text-red-400 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
