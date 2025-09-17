import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const groupBy = url.searchParams.get("groupBy") ?? "day";

  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);
  if (groupBy) qs.set("groupBy", groupBy);

  const res = await fetch(`${backend}/reports/revenue?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
    cache: "no-store",
  } as any);
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}
