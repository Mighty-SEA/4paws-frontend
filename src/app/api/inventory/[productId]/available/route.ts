import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const res = await fetch(`${backend}/inventory/${productId}/available`, { headers: { Authorization: `Bearer ${token ?? ''}` } });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}


