// app/api/watchlist/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing favorite id" }, { status: 400 });
  }

  await prisma.favorite.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
