import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const ck = await cookies();
  const token = ck.get("auth-token")?.value ?? "";
  const res = await fetch(`${backend}/products/with-inventory`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}
