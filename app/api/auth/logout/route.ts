import { NextResponse } from "next/server";
import { USER_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set({
    name: USER_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return res;
}
