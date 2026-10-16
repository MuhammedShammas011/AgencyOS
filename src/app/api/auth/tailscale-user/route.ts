import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { findEmployeeByTailscaleNode } from '@/lib/tailscale/employees';

const execFileAsync = promisify(execFile);

// Tailscale binary path on macOS / Linux systems
const TAILSCALE_BIN = '/usr/local/bin/tailscale';

// Loopback addresses for the local machine running the server
const LOCAL_HOST_TAILSCALE_IP = '100.84.151.95';

interface TailscaleWhoisOutput {
  Node?: {
    ID?: number;
    Name?: string;
    ComputedName?: string;
    Addresses?: string[];
    StableTailnetID?: string;
  };
  UserProfile?: {
    LoginName?: string;
    DisplayName?: string;
  };
}


export async function GET(request: NextRequest) {
  try {
    // 1. Extract originating client IP from request headers (server-side socket remote address)
    // Never trust client-supplied request body or URL query parameters
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    let clientIp = forwardedFor.split(',')[0].trim();

    // Strip IPv6-mapped IPv4 prefix (e.g., "::ffff:100.84.151.95" -> "100.84.151.95")
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.replace('::ffff:', '');
    }

    // Fallback if empty
    if (!clientIp) {
      clientIp = '127.0.0.1';
    }

    // 2. Resolve loopback connections originating locally on this server machine
    const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost';
    const queryIp = isLoopback ? LOCAL_HOST_TAILSCALE_IP : clientIp;

    // 3. Query local Tailscale daemon cryptographically via whois
    let whoisData: TailscaleWhoisOutput | null = null;
    try {
      const { stdout } = await execFileAsync(
        TAILSCALE_BIN,
        ['whois', '--json', queryIp],
        { timeout: 3000 }
      );
      whoisData = JSON.parse(stdout) as TailscaleWhoisOutput;
    } catch {
      // Peer not found, tailscaled error, or not a Tailscale peer
      whoisData = null;
    }

    // 4. If Tailscale daemon does not recognize the peer, return Unknown Employee
    if (!whoisData || !whoisData.Node) {
      return NextResponse.json(
        {
          employeeName: 'Unknown Employee',
          identified: false,
          roleTitle: 'Unregistered Device',
          clientIp,
          tailscale: null,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // 5. Match server-verified node against employee registry
    const computedName = whoisData.Node.ComputedName || '';
    const fqdn = whoisData.Node.Name || '';
    const addresses = whoisData.Node.Addresses || [];

    const matchedEmployee = findEmployeeByTailscaleNode({
      computedName,
      fqdn,
      addresses,
    });

    if (matchedEmployee) {
      return NextResponse.json(
        {
          employeeName: matchedEmployee.name,
          identified: true,
          roleTitle: matchedEmployee.roleTitle,
          department: matchedEmployee.department,
          clientIp,
          tailscale: {
            nodeName: computedName,
            fqdn,
            ip: queryIp,
            displayName: whoisData.UserProfile?.DisplayName || matchedEmployee.name,
          },
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    // 6. Valid Tailscale node, but not mapped to any known employee
    return NextResponse.json(
      {
        employeeName: 'Unknown Employee',
        identified: false,
        roleTitle: 'Unmapped Device',
        clientIp,
        tailscale: {
          nodeName: computedName,
          fqdn,
          ip: queryIp,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        employeeName: 'Unknown Employee',
        identified: false,
        error: error instanceof Error ? error.message : 'Identification failure',
      },
      {
        status: 200, // Return 200 with fallback to prevent UI crash
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
