import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const { id: promisedId } = await params;

  // Prefer route param; fall back to parsing from the URL path
  const idFromParams = promisedId;
  const idFromPath = (() => {
    try {
      const url = new URL(req.url);
      const parts = url.pathname.split("/");
      return parts[parts.length - 1];
    } catch {
      return undefined;
    }
  })();

  const id = idFromParams || idFromPath;

  if (!id || id === "undefined" || id === "null") {
    return NextResponse.json({ error: "Missing widget id" }, { status: 400 });
  }

  try {
    await prisma.dashboardWidget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete dashboard widget", err);
    return NextResponse.json(
      { error: "Widget not found" },
      { status: 404 }
    );
  }
}
