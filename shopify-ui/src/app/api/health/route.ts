import { NextResponse } from 'next/server';
export const runtime = 'node';
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
