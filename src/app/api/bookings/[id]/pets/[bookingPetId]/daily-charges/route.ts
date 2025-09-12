import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; bookingPetId: string }> }) {
  const { id, bookingPetId } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/daily-charges`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; bookingPetId: string }> }) {
  const { id, bookingPetId } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json();
  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/daily-charges`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; bookingPetId: string }> }) {
  const { id, bookingPetId } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/daily-charges/generate-today`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
