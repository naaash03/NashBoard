// app/api/watchlist/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@nashboard.local";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") ?? undefined;

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo User" },
  });
  const userId = user.id;

  const items = await prisma.favorite.findMany({
    where: {
      userId,
      ...(sport ? { sport } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { label, entityId, entityType, sport } = await req.json();

  if (!sport || !["NFL", "NBA", "MLB"].includes(sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  if (!label || !entityId || !entityType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo User" },
  });
  const userId = user.id;

  const item = await prisma.favorite.create({
    data: {
      userId,
      label,
      entityId,
      entityType,
      sport,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
