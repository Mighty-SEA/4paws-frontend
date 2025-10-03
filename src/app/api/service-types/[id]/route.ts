import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json();
  const { id } = await params;
  const res = await fetch(`${backend}/service-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("service-types");
    revalidateTag("services");
  }
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const { id } = await params;
  const res = await fetch(`${backend}/service-types/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json().catch(() => ({}));
  if (typeof revalidateTag === "function") {
    revalidateTag("service-types");
    revalidateTag("services");
  }
  return NextResponse.json(data, { status: res.status });
}
