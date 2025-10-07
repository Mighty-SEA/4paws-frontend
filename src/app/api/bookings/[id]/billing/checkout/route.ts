import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${backend}/bookings/${id}/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));

  // Revalidate tags after successful checkout
  if (res.ok) {
    revalidateTag("bookings"); // Revalidate bookings list
    revalidateTag("booking-detail"); // Revalidate booking detail
    revalidateTag("payments"); // Revalidate payments
  }

  return NextResponse.json(data, { status: res.status });
}
