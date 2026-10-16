import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  const result = await testConnection();
  if (!result.connected) {
    return NextResponse.json(
      { status: 'error', ...result },
      { status: 500 }
    );
  }
  return NextResponse.json({ status: 'healthy', ...result });
}
