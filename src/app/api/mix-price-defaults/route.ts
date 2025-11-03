import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const resolveBackendBase = () =>
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

const extractToken = async () => {
  const ck = await cookies();
  return ck.get("auth-token")?.value ?? "";
};

export async function GET() {
  const backend = resolveBackendBase();
  const token = await extractToken();
  const res = await fetch(`${backend}/mix-price-defaults`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const backend = resolveBackendBase();
  const token = await extractToken();
  const body = await req.json();
  const res = await fetch(`${backend}/mix-price-defaults`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("mix-price-defaults");
  }
  return NextResponse.json(data, { status: res.status });
}

