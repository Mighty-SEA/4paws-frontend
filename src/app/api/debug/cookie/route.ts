import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({
    message: "Cookie test",
    timestamp: new Date().toISOString(),
  });

  // Test cookie dengan berbagai setting
  response.cookies.set("test-cookie-simple", "value1", {
    path: "/",
  });

  response.cookies.set("test-cookie-secure", "value2", {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
  });

  console.log("[DEBUG] Test cookies set");

  return response;
}
