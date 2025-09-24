import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authToken = req.cookies.get("auth-token");
  const allCookies = req.cookies.getAll();

  return NextResponse.json({
    hasAuthToken: !!authToken,
    authTokenValue: authToken?.value ? `${authToken.value.substring(0, 20)}...` : null,
    allCookieNames: allCookies.map((c) => c.name),
    userAgent: req.headers.get("user-agent"),
    url: req.url,
    timestamp: new Date().toISOString(),
  });
}
