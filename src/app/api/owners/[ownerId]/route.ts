import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ownerId: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = _req.cookies.get("auth-token")?.value;
  const { ownerId } = await params;
  const res = await fetch(`${backend}/owners/${ownerId}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ownerId: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json();
  const { ownerId } = await params;
  const res = await fetch(`${backend}/owners/${ownerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("owners");
    revalidateTag("owner-detail");
  }
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ ownerId: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const { ownerId } = await params;
  const res = await fetch(`${backend}/owners/${ownerId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("owners");
    revalidateTag("owner-detail");
  }
  return NextResponse.json(data, { status: res.status });
}
