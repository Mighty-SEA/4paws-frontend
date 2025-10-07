import { NextResponse, type NextRequest } from "next/server";

function getBackendUrl(): string {
  return process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
}

function getCookieOptions(req: NextRequest) {
  // Detect if request is over HTTPS (check x-forwarded-proto for proxy/reverse proxy)
  const protocol = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol;
  const isHttps = protocol === "https:" || protocol === "https";

  return {
    httpOnly: true, // Security: prevent XSS
    secure: isHttps, // Only secure over HTTPS (works with IP over HTTP too)
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
    sameSite: "lax" as const, // Balance security & usability
    // No domain - auto-handled by browser
  };
}

async function authenticateUser(username: string, password: string, backendUrl: string) {
  const res = await fetch(`${backendUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    // server-side fetch; no CORS restrictions
  });

  process.stdout.write(`[LOGIN] Backend response status: ${res.status}\n`);
  console.log("[LOGIN] Backend response status:", res.status);

  if (!res.ok) {
    return { success: false, error: "Invalid credentials", status: 401 };
  }

  const data = await res.json();
  const token = data?.access_token as string | undefined;

  process.stdout.write(`[LOGIN] Token received: ${token ? "YES" : "NO"}\n`);
  console.log("[LOGIN] Token received:", token ? "YES" : "NO");

  if (!token) {
    return { success: false, error: "Token missing", status: 500 };
  }

  return { success: true, token };
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const backendUrl = getBackendUrl();

    // Use process.stdout for PM2 logging
    process.stdout.write(`[LOGIN] Backend URL: ${backendUrl}\n`);
    console.log("[LOGIN] Backend URL:", backendUrl);

    const authResult = await authenticateUser(username, password, backendUrl);

    if (!authResult.success) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
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

    const cookieOptions = getCookieOptions(req);

    process.stdout.write(`[LOGIN] Setting cookie with options: ${JSON.stringify(cookieOptions)}\n`);
    console.log("[LOGIN] Setting cookie with options:", cookieOptions);
    response.cookies.set("auth-token", authResult.token, cookieOptions);

    process.stdout.write("[LOGIN] Cookie set successfully\n");
    console.log("[LOGIN] Cookie set successfully");
    return response;
  } catch {
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
