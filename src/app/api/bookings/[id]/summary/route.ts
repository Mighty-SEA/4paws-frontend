import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const ck = await cookies();
  const token = ck.get("auth-token")?.value;
  const { id } = await params;
  const res = await fetch(`${backend}/bookings/${id}/summary`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
