import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookingPetId: string }> },
) {
  try {
    const { id, bookingPetId } = await params;
    const body = await request.json();

    const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/quick-mix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Quick mix API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bookingPetId: string }> },
) {
  try {
    const { id, bookingPetId } = await params;
    const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const quickMixId = url.searchParams.get("id");
    if (!quickMixId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const response = await fetch(`${backend}/bookings/${id}/pets/${bookingPetId}/quick-mix?id=${quickMixId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await response.text();
    let payload: any = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { message: text };
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Quick mix API delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
