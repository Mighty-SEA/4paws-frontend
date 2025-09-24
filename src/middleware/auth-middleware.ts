import { NextResponse, type NextRequest } from "next/server";

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authToken = req.cookies.get("auth-token");
  const isLoggedIn = !!authToken;

  // Debug: add header untuk lihat dari browser dev tools
  const response = NextResponse.next();
  response.headers.set("x-debug-auth", isLoggedIn ? "true" : "false");
  response.headers.set("x-debug-pathname", pathname);
  response.headers.set("x-debug-cookie-count", req.cookies.getAll().length.toString());

  // Skip middleware untuk debug endpoint
  if (pathname.startsWith("/api/debug")) {
    return response;
  }

  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    console.log(`[AUTH] Redirecting to login: ${pathname} - no auth token`);
    return NextResponse.redirect(new URL("/auth/v1/login", req.url));
  }

  if (isLoggedIn && (pathname === "/auth/login" || pathname === "/auth/v1/login" || pathname === "/auth/v2/login")) {
    console.log(`[AUTH] Redirecting to dashboard: ${pathname} - has auth token`);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return response;
}
