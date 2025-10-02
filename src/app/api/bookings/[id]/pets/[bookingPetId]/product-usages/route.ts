import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; bookingPetId: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const ck = await cookies();
  const token = ck.get("auth-token")?.value ?? "";
  const { id, bookingPetId } = await params;
  const body = await req.json();
  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/product-usages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; bookingPetId: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const ck = await cookies();
  const token = ck.get("auth-token")?.value ?? "";
  const { id, bookingPetId } = await params;
  const url = new URL(req.url);
  const usageId = url.searchParams.get("usageId");
  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/product-usages/${usageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
