import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WIDGET_DEFINITIONS } from "@/lib/widgets/registry";

const DEMO_EMAIL = "demo@nashboard.local";

export async function POST(req: Request) {
  const { widgetKey, sport } = await req.json();

  // Validate widget
  const def = WIDGET_DEFINITIONS.find((w) => w.key === widgetKey);
  if (!def) {
    return NextResponse.json({ error: "Unknown widget" }, { status: 400 });
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { dashboards: true },
  });

  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 500 });
  }

  // Grab the dashboard for that sport
  const dashboard = user.dashboards.find((d) => d.sport === sport);

  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  // Insert widget at bottom of layout (simple positioning)
  const widget = await prisma.dashboardWidget.create({
    data: {
      dashboardId: dashboard.id,
      widgetKey,
      x: 0,
      y: 9999, // will be normalized in front-end later
      w: def.defaultSize.w,
      h: def.defaultSize.h,
      settings: {},
    },
  });

  return NextResponse.json({ widget });
}
