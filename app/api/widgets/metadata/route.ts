import { NextRequest, NextResponse } from "next/server";
import { WIDGET_DEFINITIONS } from "@/lib/widgets/registry";

export async function GET(req: NextRequest) {
  const sportParam = req.nextUrl.searchParams.get("sport");
  const sport = sportParam
    ? (sportParam.toUpperCase() as
        | (typeof WIDGET_DEFINITIONS)[number]["supportedSports"][number]
        | undefined)
    : undefined;

  let widgets = WIDGET_DEFINITIONS;

  if (sport) {
    widgets = widgets.filter((w) => w.supportedSports.includes(sport));
  }

  return NextResponse.json({ widgets });
}
