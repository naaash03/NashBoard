import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.upsert({
      where: { email: trimmedEmail },
      update: {
        name: typeof name === "string" && name.trim() ? name.trim() : undefined,
      },
      create: {
        email: trimmedEmail,
        name: typeof name === "string" && name.trim() ? name.trim() : null,
      },
    });

    const res = NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 200 }
    );

    res.cookies.set({
      name: USER_COOKIE_NAME,
      value: user.id,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Error in POST /api/auth/login", err);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
