import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport, DashboardMode } from "@prisma/client";

const DEMO_EMAIL = "demo@nashboard.local";

function parseSport(sport: string | null): Sport {
  if (sport === "NBA") return Sport.NBA;
  if (sport === "MLB") return Sport.MLB;
  return Sport.NFL;
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const sportParam = body.sport as string | undefined;
  const modeParam = body.mode as string | undefined;

  if (!modeParam || !["BEGINNER", "ADVANCED"].includes(modeParam)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const sport = parseSport(sportParam ?? null);
  const mode = modeParam === "ADVANCED" ? DashboardMode.ADVANCED : DashboardMode.BEGINNER;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 500 });
  }

  // Find or create dashboard for this sport
  let dashboard = await prisma.dashboard.findFirst({
    where: { userId: user.id, sport },
  });

  if (!dashboard) {
    dashboard = await prisma.dashboard.create({
      data: {
        userId: user.id,
        sport,
        mode,
        title:
          sport === Sport.NFL
            ? "NFL NashBoard"
            : sport === Sport.NBA
            ? "NBA NashBoard"
            : "MLB NashBoard",
      },
    });
  }

  const updated = await prisma.dashboard.update({
    where: { id: dashboard.id },
    data: { mode },
  });

  return NextResponse.json({ dashboard: updated });
}
