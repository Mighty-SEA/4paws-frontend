import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const page = url.searchParams.get("page");
  const pageSize = url.searchParams.get("pageSize");

  const qs = new URLSearchParams();
  if (type) qs.set("type", type);
  if (page) qs.set("page", page);
  if (pageSize) qs.set("pageSize", pageSize);

  const target = `${backend}/payments${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(target, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
