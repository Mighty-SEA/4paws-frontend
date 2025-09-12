import { NextResponse, type NextRequest } from "next/server";

export { }

export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json();
  const res = await fetch(`${backend}/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit");
  const types = url.searchParams.get("types");
  const productId = url.searchParams.get("productId");
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = (req as any).cookies?.get?.("auth-token")?.value;
  const qs = new URLSearchParams();
  if (limit) qs.set("limit", limit);
  if (types) qs.set("types", types);
  if (productId) qs.set("productId", productId);
  const res = await fetch(`${backend}/inventory?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
    cache: "no-store",
  } as any);
  const data = await res.json().catch(() => []);
  return new Response(JSON.stringify(data), { status: res.status, headers: { "Content-Type": "application/json" } });
}
