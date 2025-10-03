import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const backendUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

    const res = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      // server-side fetch; no CORS restrictions
    });

    if (!res.ok) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const data = await res.json();
    const token = data?.access_token as string | undefined;
    if (!token) {
      return NextResponse.json({ message: "Token missing" }, { status: 500 });
    }

    // Best practice: Simple cookie settings that work with proxy
    const response = NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      },
    );

    // Set cookie without domain for better compatibility
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: true, // Always true in production with HTTPS
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
      sameSite: "lax",
      // No domain - let browser handle it automatically
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
