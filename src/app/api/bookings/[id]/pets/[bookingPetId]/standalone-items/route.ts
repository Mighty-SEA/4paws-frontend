import { NextRequest, NextResponse } from "next/server";

// Replace-all standalone items (products + mixes) for a bookingPet (no visit)
// PUT body shape:
// {
//   singles: Array<{ productId: number; quantity: string | number }>,
//   mixes: Array<{ label?: string; components: Array<{ productId: number; quantity: string | number }> }>
// }
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; bookingPetId: string }> }) {
  const { id, bookingPetId } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const singles: Array<{ productId: number; quantity: string | number }> = Array.isArray(body?.singles)
    ? body.singles
    : [];
  const mixes: Array<{ label?: string; components: Array<{ productId: number; quantity: string | number }> }> =
    Array.isArray(body?.mixes) ? body.mixes : [];

  try {
    // Load current booking to determine existing standalone items
    const bookingRes = await fetch(`${backend}/bookings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const booking = await bookingRes.json().catch(() => ({}));
    const bp = Array.isArray(booking?.pets)
      ? booking.pets.find((x: any) => String(x.id) === String(bookingPetId))
      : null;

    // Gather existing standalone mix ids and standalone product usage ids
    const standaloneMixIds: number[] = Array.isArray(bp?.mixUsages)
      ? (bp.mixUsages as any[])
          .filter((mu) => !mu?.visitId)
          .map((mu) => Number(mu.id))
          .filter((n) => Number.isFinite(n))
      : [];
    const standaloneProductUsageIds: number[] = Array.isArray(bp?.productUsages)
      ? (bp.productUsages as any[])
          .filter((pu) => !pu?.visitId && !pu?.examinationId)
          .map((pu) => Number(pu.id))
          .filter((n) => Number.isFinite(n))
      : [];

    // Delete existing standalone mixes
    for (const mixId of standaloneMixIds) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/quick-mix?id=${mixId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    // Delete existing standalone product usages
    for (const usageId of standaloneProductUsageIds) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/product-usages/${usageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    // Recreate singles
    for (const s of singles) {
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/product-usages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: Number(s.productId), quantity: String(s.quantity ?? "0") }),
      });
    }

    // Recreate mixes
    for (const mix of mixes) {
      const comps = Array.isArray(mix?.components) ? mix.components : [];
      if (comps.length === 0) continue;
      await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/quick-mix`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mixName: mix?.label && String(mix.label).trim().length ? mix.label : undefined,
          price: (mix as any)?.price ?? undefined,
          components: comps.map((c) => ({ productId: Number(c.productId), quantity: String(c.quantity ?? "0") })),
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("replace-standalone-items error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
