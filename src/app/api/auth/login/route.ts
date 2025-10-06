import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const backendUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

    // Use process.stdout for PM2 logging
    process.stdout.write(`[LOGIN] Backend URL: ${backendUrl}\n`);
    console.log("[LOGIN] Backend URL:", backendUrl);

    const res = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      // server-side fetch; no CORS restrictions
    });

    process.stdout.write(`[LOGIN] Backend response status: ${res.status}\n`);
    console.log("[LOGIN] Backend response status:", res.status);

    if (!res.ok) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const data = await res.json();
    const token = data?.access_token as string | undefined;

    process.stdout.write(`[LOGIN] Token received: ${token ? "YES" : "NO"}\n`);
    console.log("[LOGIN] Token received:", token ? "YES" : "NO");

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

    // Production-ready cookie settings
    const cookieOptions = {
      httpOnly: true, // Security: prevent XSS
      secure: process.env.NODE_ENV === "production", // HTTPS only in production; allow HTTP in dev
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
      sameSite: "lax" as const, // Balance security & usability
      // No domain - auto-handled by browser
    };

    process.stdout.write(`[LOGIN] Setting cookie with options: ${JSON.stringify(cookieOptions)}\n`);
    console.log("[LOGIN] Setting cookie with options:", cookieOptions);
    response.cookies.set("auth-token", token, cookieOptions);

    process.stdout.write("[LOGIN] Cookie set successfully\n");
    console.log("[LOGIN] Cookie set successfully");
    return response;
  } catch {
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
