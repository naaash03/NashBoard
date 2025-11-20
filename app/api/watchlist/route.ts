// app/api/watchlist/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// For now we use a single demo user. Later this connects to real auth.
const DEMO_EMAIL = "demo@nashboard.local";

async function getOrCreateDemoUser() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      displayName: "Demo User",
      modePreference: "BEGINNER",
    },
  });

  return user;
}

// GET /api/watchlist  -> all items for the demo user
export async function GET() {
  const user = await getOrCreateDemoUser();

  const items = await prisma.watchlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

// POST /api/watchlist  -> create a new watchlist item
export async function POST(req: Request) {
  const body = await req.json();
  const { name, team, position, note } = body;

  if (!name || !team || !position) {
    return NextResponse.json(
      { error: "name, team, and position are required" },
      { status: 400 }
    );
  }

  const user = await getOrCreateDemoUser();

  const created = await prisma.watchlistItem.create({
    data: {
      userId: user.id,
      name,
      team,
      position,
      note: note ?? "",
    },
  });

  return NextResponse.json(created, { status: 201 });
}
