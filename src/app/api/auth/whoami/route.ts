import { NextRequest, NextResponse } from 'next/server';
import http from 'http';

// Test hooking into http.IncomingMessage
let hooked = false;
if (!hooked) {
  const origInit = (http.IncomingMessage.prototype as any)._addHeaderLine;
  // Or check socket on IncomingMessage
  Object.defineProperty(http.IncomingMessage.prototype, 'xRealSocketIp', {
    get() {
      return this.socket?.remoteAddress;
    },
    configurable: true,
  });
  hooked = true;
}

export async function GET(req: NextRequest) {
  // Check if any incoming message has xRealSocketIp
  return NextResponse.json({
    hooked,
    xForwardedFor: req.headers.get('x-forwarded-for'),
  });
}
