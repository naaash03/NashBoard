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
  try {
    const { searchParams } = new URL(req.url);
    const sportParam = searchParams.get("sport");
    const sport = parseSport(sportParam);

    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {},
      create: { email: DEMO_EMAIL, name: "Demo User" },
    });
    const userId = user.id;

    // Find or create dashboard for this sport
    let dashboard = await prisma.dashboard.findFirst({
      where: { userId, sport },
    });

    if (!dashboard) {
      dashboard = await prisma.dashboard.create({
        data: {
          userId,
          sport,
          mode: DashboardMode.BEGINNER,
          title:
            sport === Sport.NFL
              ? "NFL NashBoard"
              : sport === Sport.NBA
              ? "NBA NashBoard"
              : "MLB NashBoard",
          description: `Default ${sport} dashboard`,
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

    return NextResponse.json({ dashboard, widgets }, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/dashboard/widgets", err);
    return NextResponse.json(
      { dashboard: null, widgets: [] },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { widgetKey, sport } = await req.json();

    // Validate widget
    const def = WIDGET_DEFINITIONS.find((w) => w.key === widgetKey);
    if (!def) {
      return NextResponse.json({ error: "Unknown widget" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {},
      create: { email: DEMO_EMAIL, name: "Demo User" },
    });
    const userId = user.id;

    // Ensure dashboard exists for this sport (create if missing)
    let dashboard = await prisma.dashboard.findFirst({
      where: { userId, sport },
    });

    if (!dashboard) {
      dashboard = await prisma.dashboard.create({
        data: {
          userId,
          sport,
          mode: DashboardMode.BEGINNER,
          title:
            sport === Sport.NFL
              ? "NFL NashBoard"
              : sport === Sport.NBA
              ? "NBA NashBoard"
              : "MLB NashBoard",
          description: `Default ${sport} dashboard`,
        },
      });
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
  } catch (err) {
    console.error("Error in POST /api/dashboard/widgets", err);
    return NextResponse.json(
      { error: "Failed to add widget (server error)" },
      { status: 500 }
    );
  }
}
