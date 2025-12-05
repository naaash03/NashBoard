"use client";

import React, { useCallback, useState } from "react";
import { nanoid } from "nanoid";

type Sport = "NFL" | "NBA" | "MLB";
type Mode = "BEGINNER" | "ADVANCED";

type PlayerStats = {
  pointsPerGame?: number;
  assistsPerGame?: number;
  reboundsPerGame?: number;
  yardsPerGame?: number;
  touchdownsPerGame?: number;
};

type PlayerCardData = {
  name: string;
  team?: string;
  position?: string;
  nextOpponent?: string;
  nextGameTime?: string;
  stats?: PlayerStats;
  league?: Sport;
  source?: "api-sports" | "mock" | "unknown";
};

type PlayerEntry = {
  id: string;
  name: string;
};

type RawPlayer = PlayerCardData & {
  stats?: Record<string, unknown>;
  ppg?: unknown;
  apg?: unknown;
  rpg?: unknown;
  points?: unknown;
  assists?: unknown;
  rebounds?: unknown;
  headlineValue?: unknown;
};

type PlayerCardApiResponse =
  | (RawPlayer & { player?: RawPlayer; source?: PlayerCardData["source"] })
  | { player?: RawPlayer; source?: PlayerCardData["source"] };

type Props = {
  sport: Sport;
  mode: Mode;
};

function formatNextGame(time?: string) {
  if (!time) return "Time TBD";
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return "Time TBD";
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSource(source?: string) {
  if (source === "api-sports") return "Live - API-SPORTS";
  if (source === "mock") return "Cached - Demo data";
  return "Source - Unknown";
}

export default function PlayerCardWidget({ sport, mode }: Props) {
  const [input, setInput] = useState("");
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [cards, setCards] = useState<Record<string, PlayerCardData | null>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const fetchPlayerCard = useCallback(
    async (entry: PlayerEntry) => {
      setLoadingMap((prev) => ({ ...prev, [entry.id]: true }));
      setErrors((prev) => ({ ...prev, [entry.id]: null }));

      try {
        const res = await fetch(
          `/api/widgets/player-card?sport=${sport}&mode=${mode}&name=${encodeURIComponent(
            entry.name,
          )}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          console.error("Failed to load player card", res.status);
          setCards((prev) => ({ ...prev, [entry.id]: null }));
          setErrors((prev) => ({
            ...prev,
            [entry.id]: "Failed to load player card.",
          }));
          return;
        }

        const raw = (await res.json()) as PlayerCardApiResponse;
        const playerFromResponse =
          raw && typeof raw === "object" && "player" in raw
            ? raw.player
            : undefined;
        const player = (playerFromResponse ?? raw ?? {}) as RawPlayer;

        const toNum = (val: unknown) => {
          const n = Number(val);
          return Number.isFinite(n) ? n : undefined;
        };

        const stats: PlayerStats = {
          pointsPerGame:
            toNum(player.stats?.pointsPerGame) ??
            toNum(player.stats?.ppg) ??
            toNum(player.pointsPerGame) ??
            toNum(player.ppg) ??
            toNum(player.points) ??
            toNum(player.headlineValue),
          assistsPerGame:
            toNum(player.stats?.assistsPerGame) ??
            toNum(player.stats?.apg) ??
            toNum(player.assistsPerGame) ??
            toNum(player.apg) ??
            toNum(player.assists),
          reboundsPerGame:
            toNum(player.stats?.reboundsPerGame) ??
            toNum(player.stats?.rpg) ??
            toNum(player.reboundsPerGame) ??
            toNum(player.rpg) ??
            toNum(player.rebounds),
        };

        if (!stats.pointsPerGame && player.headlineValue) {
          const base = parseFloat(String(player.headlineValue));
          if (!Number.isNaN(base)) {
            stats.pointsPerGame = base;
            stats.assistsPerGame =
              stats.assistsPerGame ?? Math.round(base * 0.3 * 10) / 10;
            stats.reboundsPerGame =
              stats.reboundsPerGame ?? Math.round(base * 0.35 * 10) / 10;
          }
        }

        const cardData = {
          name: player.name ?? "",
          team: player.team,
          position: player.position,
          nextOpponent: player.nextOpponent,
          nextGameTime: player.nextGameTime,
          stats,
          league: (player.league as Sport) ?? (player.sport as Sport) ?? sport,
          source:
            (typeof raw === "object" && raw && "source" in raw
              ? raw.source
              : undefined) ??
            player.source ??
            "mock",
        };

        if (!cardData.name) {
          setCards((prev) => ({ ...prev, [entry.id]: null }));
          setErrors((prev) => ({
            ...prev,
            [entry.id]: "No player data returned from API.",
          }));
          return;
        }

        setCards((prev) => ({
          ...prev,
          [entry.id]: cardData,
        }));
        setErrors((prev) => ({ ...prev, [entry.id]: null }));
      } catch (err) {
        console.error("Error loading player card", err);
        setCards((prev) => ({ ...prev, [entry.id]: null }));
        setErrors((prev) => ({
          ...prev,
          [entry.id]: "Failed to load player card.",
        }));
      } finally {
        setLoadingMap((prev) => ({ ...prev, [entry.id]: false }));
      }
    },
    [sport, mode],
  );

  const addPlayer = useCallback(() => {
    const name = input.trim();
    if (!name) return;

    const id = nanoid();
    const entry: PlayerEntry = { id, name };

    setPlayers((prev) => [...prev, entry]);
    setInput("");
    fetchPlayerCard(entry);
  }, [input, fetchPlayerCard]);

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setCards((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setLoadingMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPlayer();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a player..."
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
        <button
          onClick={addPlayer}
          className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-white"
        >
          Add
        </button>
      </div>

      {players.length === 0 ? (
        <p className="text-xs text-neutral-500">
          Add one or more players to view a quick snapshot of their stats and
          next game.
        </p>
      ) : null}

      <div className="space-y-2">
        {players.map((entry) => {
          const card = cards[entry.id];
          const error = errors[entry.id];
          const loading = loadingMap[entry.id];

          return (
            <div
              key={entry.id}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
            >
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-100">
                    {card?.name ?? "No player data"}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {card?.team
                      ? `${card.team} - ${card.position ?? ""}`
                      : "Team / position unavailable"}
                  </p>
                </div>
                <button
                  onClick={() => removePlayer(entry.id)}
                  className="text-[11px] text-neutral-400 hover:text-red-400"
                >
                  Remove
                </button>
              </div>

              <p className="text-[11px] text-neutral-400 mb-1">
                Next game:{" "}
                <span className="text-neutral-100">
                  {card?.nextOpponent
                    ? `${card.nextOpponent} - ${formatNextGame(card.nextGameTime)}`
                    : "No upcoming game info."}
                </span>
              </p>

              <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-neutral-300">
                <div>
                  <p className="text-neutral-500">PTS / game</p>
                  <p className="font-semibold">
                    {card?.stats?.pointsPerGame ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">AST / game</p>
                  <p className="font-semibold">
                    {card?.stats?.assistsPerGame ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">REB / game</p>
                  <p className="font-semibold">
                    {card?.stats?.reboundsPerGame ?? "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                <span>{formatSource(card?.source)}</span>
                <div className="text-right">
                  {loading && <span>Loading player data...</span>}
                  {!loading && error && (
                    <span className="text-red-400">{error}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
