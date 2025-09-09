import { NextResponse, type NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ownerId: string }> }) {
  const backend = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  const token = _req.cookies.get('auth-token')?.value;
  const { ownerId } = await params;
  const res = await fetch(`${backend}/owners/${ownerId}`, {
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

