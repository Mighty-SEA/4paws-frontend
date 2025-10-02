import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; bookingPetId: string }> }) {
  const { id, bookingPetId } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json();
  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("bookings");
    revalidateTag("booking-detail");
  }
  return NextResponse.json(data, { status: res.status });
}
