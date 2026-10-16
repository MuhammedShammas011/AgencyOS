/**
 * Tailscale Device & Employee Mapping Registry
 *
 * Maps registered Tailscale device identities (node names, IPs, DNS hostnames)
 * to verified agency employee profiles.
 */

export interface EmployeeDeviceMapping {
  name: string;
  roleTitle: string;
  department: string;
  /**
   * Recognized Tailscale device identifiers:
   * - Computed node name (e.g., 'shammass-macbook-pro', 'iphone-14-pro')
   * - Tailnet FQDN (e.g., 'shammass-macbook-pro.tail2d68e9.ts.net')
   * - Specific Tailscale IP (e.g., '100.84.151.95')
   */
  devices: string[];
}

export const EMPLOYEE_DEVICE_REGISTRY: EmployeeDeviceMapping[] = [
  {
    name: 'Shammas',
    roleTitle: 'Lead - Web Development & Production',
    department: 'Engineering & Production',
    devices: [
      'shammass-macbook-pro',
      '100.84.151.95',
      'shammass-macbook-pro.tail2d68e9.ts.net.',
      'shammass-macbook-pro.tail2d68e9.ts.net',
    ],
  },
  {
    name: 'Shahil Mohammed',
    roleTitle: 'Business Development & Growth',
    department: 'Sales & Client Acquisition',
    devices: [
      'iphone-14-pro',
      '100.96.31.39',
      'iphone-14-pro.tail2d68e9.ts.net.',
      'iphone-14-pro.tail2d68e9.ts.net',
    ],
  },
  {
    name: 'Shadin',
    roleTitle: 'Lead - Branding & Creative Direction',
    department: 'Design & Creative',
    devices: [
      'shadins-macbook',
      'shadin-device',
      'shadins-macbook.tail2d68e9.ts.net',
    ],
  },
  {
    name: 'Irshad Puthiyakath',
    roleTitle: 'Client Acquisition & Partnerships',
    department: 'Sales & Partnerships',
    devices: [
      'irshad-device',
      'irshad-macbook',
      'irshad-device.tail2d68e9.ts.net',
    ],
  },
  {
    name: 'Nihal',
    roleTitle: 'Strategic Growth & Inbound',
    department: 'Performance & Inbound',
    devices: [
      'nihal-device',
      'nihal-laptop',
      'nihal-device.tail2d68e9.ts.net',
    ],
  },
];

/**
 * Searches the registry for an employee matching any of the verified Tailscale identifiers.
 */
export function findEmployeeByTailscaleNode(identifiers: {
  computedName?: string | null;
  fqdn?: string | null;
  addresses?: string[] | null;
}): EmployeeDeviceMapping | null {
  const normalizedTargets = [
    identifiers.computedName?.toLowerCase().trim(),
    identifiers.fqdn?.toLowerCase().trim().replace(/\.$/, ''),
    ...(identifiers.addresses || []).map((addr) =>
      addr.split('/')[0].toLowerCase().trim()
    ),
  ].filter(Boolean) as string[];

  for (const employee of EMPLOYEE_DEVICE_REGISTRY) {
    const matched = employee.devices.some((registeredDevice) => {
      const normalizedDevice = registeredDevice.toLowerCase().trim().replace(/\.$/, '');
      return normalizedTargets.some(
        (target) => target === normalizedDevice || target.startsWith(normalizedDevice)
      );
    });

    if (matched) {
      return employee;
    }
  }

  return null;
}
