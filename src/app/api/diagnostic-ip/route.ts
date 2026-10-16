import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const keys = Object.keys(req);
  const symbols = Object.getOwnPropertySymbols(req).map((s) => s.toString());
  
  // Also check if any symbol has socket or request
  const inspected: Record<string, any> = {};
  for (const sym of Object.getOwnPropertySymbols(req)) {
    try {
      const val = (req as any)[sym];
      inspected[sym.toString()] = typeof val === 'object' ? Object.keys(val || {}) : typeof val;
    } catch (e) {
      // ignore
    }
  }

  return NextResponse.json({
    keys,
    symbols,
    inspected,
    headers: Object.fromEntries(req.headers.entries())
  });
}
