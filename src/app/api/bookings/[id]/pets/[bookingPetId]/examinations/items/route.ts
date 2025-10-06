import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Replace-all Items for an Examination (single source of truth)
// PUT body shape:
// {
//   meta: { weight?, temperature?, notes?, chiefComplaint?, additionalNotes?, diagnosis?, prognosis?, doctorId?, paravetId?, adminId?, groomerId? },
//   singles: Array<{ productId: number; quantity: string | number }>,
//   mixes: Array<{ label?: string; price?: string | number; components: Array<{ productId: number; quantity: string | number }> }>
// }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookingPetId: string }> },
) {
  const { id, bookingPetId } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const meta = body?.meta ?? {};
  const singles: Array<{ productId: number; quantity: string | number }> = Array.isArray(body?.singles)
    ? body.singles
    : [];
  const mixes: Array<{
    label?: string;
    price?: string | number;
    components: Array<{ productId: number; quantity: string | number }>;
  }> = Array.isArray(body?.mixes) ? body.mixes : [];

  try {
    // Use the new unified endpoint that handles everything in one transaction
    const res = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/examinations/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ meta, singles, mixes }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("updateItems error:", errorText);
      return NextResponse.json({ error: errorText || "Failed to update examination" }, { status: res.status });
    }

    const result = await res.json().catch(() => ({ ok: true }));

    if (typeof revalidateTag === "function") {
      revalidateTag("bookings");
      revalidateTag("booking-detail");
      revalidateTag("pets");
      revalidateTag("medical-records");
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("replace-examination-items error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Backward compatibility if any caller still uses PUT
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string; bookingPetId: string }> }) {
  return PATCH(request, ctx as any);
}
