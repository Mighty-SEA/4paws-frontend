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
    // 1) Update meta first
    if (Object.keys(meta).length > 0) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/examinations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(meta),
      });
    }

    // 2) Clear singles (products) on examination
    await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/examinations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ products: [] }),
    });

    // 3) Delete all existing standalone mix usages (those without visitId) for this bookingPet
    const bookingRes = await fetch(`${backend}/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const booking = await bookingRes.json().catch(() => ({}));
    const bp = Array.isArray(booking?.pets)
      ? booking.pets.find((x: any) => String(x.id) === String(bookingPetId))
      : null;
    const standaloneMixIds: number[] = Array.isArray(bp?.mixUsages)
      ? bp.mixUsages
          .filter((mu: any) => !mu.visitId)
          .map((mu: any) => Number(mu.id))
          .filter((n: any) => Number.isFinite(n))
      : [];
    for (const mixId of standaloneMixIds) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/quick-mix?id=${mixId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    // 4) Re-create singles (products)
    if (singles.length > 0) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/examinations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          products: singles.map((s) => ({ productId: Number(s.productId), quantity: String(Number(s.quantity ?? 0)) })),
        }),
      });
    }

    // 5) Re-create mixes as standalone quick-mix for this bookingPet (no visitId)
    for (const mix of mixes) {
      const comps = Array.isArray(mix?.components) ? mix.components : [];
      if (comps.length === 0) continue;
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/quick-mix`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mixName:
            mix?.label && String(mix.label).trim().length
              ? mix.label
              : `Mix - ${new Date().toISOString().slice(0, 10)}`,
          price: mix?.price === "" ? undefined : mix?.price,
          components: comps.map((c: any) => ({
            productId: Number(c.productId),
            quantity: String(Number(c.quantity ?? 0)),
          })),
        }),
      });
    }

    if (typeof revalidateTag === "function") {
      revalidateTag("bookings");
      revalidateTag("booking-detail");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("replace-examination-items error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Backward compatibility if any caller still uses PUT
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string; bookingPetId: string }> }) {
  return PATCH(request, ctx as any);
}
