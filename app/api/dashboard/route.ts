// app/api/dashboard/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport, DashboardMode } from "@prisma/client";

const DEMO_EMAIL = "demo@nashboard.local";

function parseSport(param: string | null): Sport {
  if (param === "NBA") return Sport.NBA;
  if (param === "MLB") return Sport.MLB;
  return Sport.NFL; // default
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sportParam = searchParams.get("sport");
  const sport = parseSport(sportParam);

  try {
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

    // Load widgets for this dashboard
    const widgets = await prisma.dashboardWidget.findMany({
      where: { dashboardId: dashboard.id },
      orderBy: [
        { y: "asc" },
        { x: "asc" },
      ],
    });

    return NextResponse.json({ dashboard, widgets });
  } catch (err) {
    console.error("Error in GET /api/dashboard", err);
    // Safe fallback so the UI never breaks, especially for MLB.
    const fallbackDashboard = {
      id: "fallback-dashboard",
      title: sport === Sport.MLB ? "MLB NashBoard" : `${sport} NashBoard`,
      sport,
      mode: DashboardMode.BEGINNER,
      description: `Fallback ${sport} dashboard`,
    };
    return NextResponse.json(
      { dashboard: fallbackDashboard, widgets: [] },
      { status: 200 }
    );
  }
}
