import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  return NextResponse.json({
    // @ts-expect-error inspecting req properties
    reqIp: req.ip,
    // @ts-expect-error inspecting req properties
    reqSocketRemoteAddress: req.socket?.remoteAddress,
    headers: headersObj,
  });
}
