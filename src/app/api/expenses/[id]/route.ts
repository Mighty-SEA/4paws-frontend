import { NextResponse, type NextRequest } from "next/server";

export async function PUT(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = _req.cookies.get("auth-token")?.value;
  const body = await _req.json().catch(() => ({}));
  const res = await fetch(`${backend}/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  } as any);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = _req.cookies.get("auth-token")?.value;
  const res = await fetch(`${backend}/expenses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token ?? ""}` },
  } as any);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
