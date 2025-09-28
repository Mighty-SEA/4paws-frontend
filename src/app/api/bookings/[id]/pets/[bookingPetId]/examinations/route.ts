import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string; bookingPetId: string } }) {
  const { id, bookingPetId } = params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json().catch(() => ({}));

  console.log("=== FRONTEND API POST EXAMINATIONS ===");
  console.log(`BookingId: ${id}, BookingPetId: ${bookingPetId}`);
  console.log("Body:", JSON.stringify(body, null, 2));

  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/examinations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  console.log("Backend response status:", res.status);
  console.log("Backend response data:", JSON.stringify(data, null, 2));

  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; bookingPetId: string } }) {
  const { id, bookingPetId } = params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json().catch(() => undefined);

  console.log("=== FRONTEND API PUT EXAMINATIONS ===");
  console.log(`BookingId: ${id}, BookingPetId: ${bookingPetId}`);
  console.log("Body:", JSON.stringify(body, null, 2));

  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/examinations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  console.log("Backend response status:", res.status);
  console.log("Backend response data:", JSON.stringify(data, null, 2));

  return NextResponse.json(data, { status: res.status });
}
