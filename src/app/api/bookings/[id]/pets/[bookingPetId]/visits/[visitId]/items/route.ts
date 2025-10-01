import { NextRequest, NextResponse } from "next/server";

// Replace-all Items for a Visit (single source of truth)
// PUT body shape:
// {
//   meta: { visitDate?, weight?, temperature?, notes?, doctorId?, paravetId?, adminId?, groomerId?, urine?, defecation?, appetite?, condition?, symptoms? },
//   singles: Array<{ productId: number; quantity: string | number }>,
//   mixes: Array<{ label?: string; price?: string | number; components: Array<{ productId: number; quantity: string | number }> }>
// }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookingPetId: string; visitId: string }> },
) {
  const { id, bookingPetId, visitId } = await params;
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
    // 1) Update meta first (without items changes)
    if (Object.keys(meta).length > 0) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(meta),
      });
    }

    // 2) Clear singles (products)
    await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/visits/${visitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ products: [] }),
    });

    // 3) Delete all existing mix usages for this visit
    const visitRes = await fetch(`${backend}/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const booking = await visitRes.json().catch(() => ({}));
    const bp = Array.isArray(booking?.pets)
      ? booking.pets.find((x: any) => String(x.id) === String(bookingPetId))
      : null;
    const visit = bp && Array.isArray(bp?.visits) ? bp.visits.find((v: any) => String(v.id) === String(visitId)) : null;
    const existingMixIds: number[] = Array.isArray(visit?.mixUsages)
      ? visit.mixUsages.map((mu: any) => Number(mu.id)).filter((n: any) => Number.isFinite(n))
      : [];
    for (const mixId of existingMixIds) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/quick-mix?id=${mixId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    // 4) Re-create singles (products)
    if (singles.length > 0) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          products: singles.map((s) => ({ productId: Number(s.productId), quantity: String(Number(s.quantity ?? 0)) })),
        }),
      });
    }

    // 5) Re-create mixes
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
          visitId: Number(visitId),
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("replace-visit-items error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
