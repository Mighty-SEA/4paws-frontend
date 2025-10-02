import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bookingPetId: string; visitId: string }> },
) {
  const { id, bookingPetId, visitId } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json();

  // If products provided, force replace by clearing first then setting new list
  if (Array.isArray(body?.products)) {
    try {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ products: [] }),
      });
    } catch {
      // ignore
    }
  }

  const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/visits/${visitId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (typeof revalidateTag === "function") {
    revalidateTag("bookings");
    revalidateTag("booking-detail");
  }
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status });
  } catch {
    return new NextResponse(text, { status: res.status });
  }
}
