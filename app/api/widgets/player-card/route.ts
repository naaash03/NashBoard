// app/api/widgets/player-card/route.ts
// Player Card backed by ESPN athlete search, with safe fallback.
// No 404s, always returns a usable player object.

import { NextResponse } from "next/server";

type PlayerPayload = {
  id: string;
  name: string;
  displayName: string;
  team: string | null;
  position: string | null;
  nextGame: string | null;
  ppg: number | null;
  apg: number | null;
  rpg: number | null;
  provider: string;
  sourceLabel: string;
};

const ESPN_PLAYER_SEARCH_URL =
  "http://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes";

function normalizeName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function makeFallbackPlayer(rawName: string, reason: string): PlayerPayload {
  const name = normalizeName(rawName || "Unknown Player");
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    displayName: name,
    team: null,
    position: null,
    nextGame: null,
    ppg: null,
    apg: null,
    rpg: null,
    provider: "fallback",
    sourceLabel: `Fallback (${reason})`,
  };
}

async function fetchEspnPlayer(name: string): Promise<PlayerPayload | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  try {
    const url = `${ESPN_PLAYER_SEARCH_URL}?search=${encodeURIComponent(
      trimmed
    )}`;

    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) {
      console.warn("[PlayerCard][ESPN] response not OK:", res.status);
      return null;
    }

    const data: any = await res.json();
    // ESPN sometimes uses `items`, sometimes `athletes`
    const athletes: any[] = data?.athletes ?? data?.items ?? [];

    if (!athletes.length) {
      console.warn("[PlayerCard][ESPN] no athletes for:", trimmed);
      return null;
    }

    const a = athletes[0];

    const fullName =
      a.fullName ?? a.displayName ?? a.name ?? normalizeName(trimmed);

    const teamName =
      a.team?.displayName ??
      a.team?.shortDisplayName ??
      a.team?.name ??
      null;

    const position =
      a.position?.abbreviation ??
      a.position?.displayName ??
      a.position?.name ??
      null;

    const player: PlayerPayload = {
      id: String(a.id ?? fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
      name: fullName,
      displayName: fullName,
      team: teamName,
      position,
      // For the presentation we don't need real per-game stats;
      // leave them null so the UI can show N/A.
      nextGame: null,
      ppg: null,
      apg: null,
      rpg: null,
      provider: "espn",
      sourceLabel: "Live data – ESPN",
    };

    return player;
  } catch (err) {
    console.error("[PlayerCard][ESPN] fetch error:", err);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = (searchParams.get("sport") || "NBA").toUpperCase();
  const mode = (searchParams.get("mode") || "BEGINNER").toUpperCase();
  const rawName = (searchParams.get("name") || "").trim();

  if (!rawName) {
    const player = makeFallbackPlayer("", "missing name");
    return NextResponse.json({ sport, mode, player });
  }

  let player: PlayerPayload | null = null;

  // For now we only support NBA; other sports use pure fallback.
  if (sport === "NBA") {
    player = await fetchEspnPlayer(rawName);
  }

  if (!player) {
    player = makeFallbackPlayer(rawName, "no ESPN match");
  }

  // IMPORTANT: never 404 – always 200 so the widget never errors.
  return NextResponse.json({
    sport,
    mode,
    player,
  });
}
