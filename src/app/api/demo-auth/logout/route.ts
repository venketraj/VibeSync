import { NextResponse } from "next/server";
import { demoAuthCookieName } from "@/lib/demo-auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });

  response.cookies.set(demoAuthCookieName, "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
