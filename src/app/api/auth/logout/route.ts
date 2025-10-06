import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Detect if request is over HTTPS (check x-forwarded-proto for proxy/reverse proxy)
  const protocol = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol;
  const isHttps = protocol === "https:" || protocol === "https";
  
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: isHttps, // Only secure over HTTPS (works with IP over HTTP too)
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}
