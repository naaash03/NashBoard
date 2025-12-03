// app/api/watchlist/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  await prisma.favorite.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
