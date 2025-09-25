import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const category = url.searchParams.get("category");
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);
  if (category) qs.set("category", category);
  const res = await fetch(`${backend}/expenses?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${backend}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
