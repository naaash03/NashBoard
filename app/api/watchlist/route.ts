// app/api/watchlist/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Temporary: single demo user until real auth is wired in
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

// GET /api/watchlist  -> list watchlist items for demo user
export async function GET() {
  try {
    const user = await getOrCreateDemoUser();

    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/watchlist error:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}

// POST /api/watchlist  -> create a new watchlist item
export async function POST(req: Request) {
  try {
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
  } catch (error) {
    console.error("POST /api/watchlist error:", error);
    return NextResponse.json(
      { error: "Failed to create watchlist item" },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlist?id=XXX  -> delete a watchlist item by id
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    await prisma.watchlistItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/watchlist error:", error);
    return NextResponse.json(
      { error: "Failed to delete watchlist item" },
      { status: 500 }
    );
  }
}