import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  // No backend /me endpoint yet. Return minimal info using token presence.
  if (!token) return NextResponse.json({}, { status: 401 });
  return NextResponse.json({ accountRole: "MASTER" });
}
