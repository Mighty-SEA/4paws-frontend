import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const res = await fetch(`${backend}/expenses${params ? `?${params}` : ""}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
    cache: "no-store",
  } as any);
  const data = await res.json().catch(() => ({ items: [], total: 0 }));
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
  } as any);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
