"use client";

import { useEffect, useState } from "react";
import type { WidgetDefinition } from "@/lib/widgets/registry";

export default function WidgetLibrary({
  sport,
  onAddWidget,
}: {
  sport: "NFL" | "NBA" | "MLB";
  onAddWidget: (widgetKey: string) => void;
}) {
  const [widgets, setWidgets] = useState<WidgetDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/widgets/metadata?sport=${sport}`);
      const data = await res.json();
      setWidgets(data.widgets);
      setLoading(false);
    }
    load();
  }, [sport]);

  if (loading) return <div className="p-4">Loading widgets…</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Widget Library</h2>

      <div className="space-y-3">
        {widgets.map((w) => (
          <div
            key={w.key}
            className="border border-neutral-700 bg-neutral-900 rounded-xl p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="font-medium">{w.name}</p>
                <p className="text-xs text-neutral-400">{w.description}</p>
              </div>
              <button
                className="border border-neutral-600 px-2 py-1 rounded-xl text-xs"
                onClick={() => onAddWidget(w.key)}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
