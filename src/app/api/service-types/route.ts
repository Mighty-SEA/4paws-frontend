import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId");
  const qs = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : "";
  const res = await fetch(`${backend}/service-types${qs}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const body = await req.json();
  const res = await fetch(`${backend}/service-types`, {
    method: "POST",
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

export async function DELETE(req: NextRequest) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
  const token = req.cookies.get("auth-token")?.value;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }
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
