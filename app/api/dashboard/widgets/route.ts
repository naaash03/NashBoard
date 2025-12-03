import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WIDGET_DEFINITIONS } from "@/lib/widgets/registry";
import { DashboardMode, Sport } from "@prisma/client";

const DEMO_EMAIL = "demo@nashboard.local";

function parseSport(param: string | null): Sport {
  if (param === "NBA") return Sport.NBA;
  if (param === "MLB") return Sport.MLB;
  return Sport.NFL;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sportParam = searchParams.get("sport");
  const sport = parseSport(sportParam);

  // Ensure user exists
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Demo User" },
  });

  // Find or create dashboard for this sport
  let dashboard = await prisma.dashboard.findFirst({
    where: { userId: user.id, sport },
  });

  if (!dashboard) {
    dashboard = await prisma.dashboard.create({
      data: {
        userId: user.id,
        sport,
        mode: DashboardMode.BEGINNER,
        title:
          sport === Sport.NFL
            ? "NFL NashBoard"
            : sport === Sport.NBA
            ? "NBA NashBoard"
            : "MLB NashBoard",
      },
    });
  }

  const widgets = await prisma.dashboardWidget.findMany({
    where: { dashboardId: dashboard.id },
    orderBy: [
      { y: "asc" },
      { x: "asc" },
    ],
  });

  return NextResponse.json({ widgets });
}

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
