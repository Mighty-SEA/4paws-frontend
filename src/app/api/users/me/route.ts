import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({}, { status: 401 });
  // Decode JWT locally to read accountRole
  try {
    const payloadSegment = token.split(".")[1];
    const json = Buffer.from(payloadSegment, "base64").toString("utf8");
    const payload = JSON.parse(json) as { accountRole?: string; role?: string };
    return NextResponse.json({ accountRole: payload.accountRole ?? payload.role ?? "" });
  } catch {
    return NextResponse.json({ accountRole: "" });
  }
}
