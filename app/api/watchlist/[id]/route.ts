// app/api/watchlist/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@nashboard.local";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing favorite id" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo User" },
  });
  const userId = user.id;

  await prisma.favorite.deleteMany({
    where: { id, userId },
  });

  return NextResponse.json({ ok: true });
}
