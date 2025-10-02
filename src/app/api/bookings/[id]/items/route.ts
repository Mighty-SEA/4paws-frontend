import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const ck = await cookies();
  const token = ck.get("auth-token")?.value ?? "";
  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${backend}/bookings/${id}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("bookings");
    revalidateTag("booking-detail");
  }
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; itemId?: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const ck = await cookies();
  const token = ck.get("auth-token")?.value ?? "";
  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  const { id } = await params;
  const body = await req.json();
  if (!itemId) return NextResponse.json({ message: "itemId is required" }, { status: 400 });
  const res = await fetch(`${backend}/bookings/${id}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("bookings");
    revalidateTag("booking-detail");
  }
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; itemId?: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const ck = await cookies();
  const token = ck.get("auth-token")?.value ?? "";
  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");
  const { id } = await params;
  if (!itemId) return NextResponse.json({ message: "itemId is required" }, { status: 400 });
  const res = await fetch(`${backend}/bookings/${id}/items/${itemId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("bookings");
    revalidateTag("booking-detail");
  }
  return NextResponse.json(data, { status: res.status });
}
