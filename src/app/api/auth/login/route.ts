import { NextResponse, type NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

    const res = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      // server-side fetch; no CORS restrictions
    });

    if (!res.ok) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const data = await res.json();
    const token = data?.access_token as string | undefined;
    if (!token) {
      return NextResponse.json({ message: 'Token missing' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
      sameSite: 'lax',
    });
    return response;
  } catch {
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}


