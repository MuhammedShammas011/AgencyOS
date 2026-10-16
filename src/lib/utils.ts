import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isBefore } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactNumber(amount: number, currency: string = 'INR'): string {
  const symbol = currency === 'INR' ? '₹' : '$';
  if (amount >= 10000000) {
    return `${symbol}${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `${symbol}${(amount / 100000).toFixed(1)} L`;
  }
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatDate(dateString?: string | null, formatStr: string = 'MMM dd, yyyy'): string {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(d, formatStr);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    if (typeof window === 'undefined') {
      return formatDate(dateString, 'MMM dd');
    }
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function isPastDate(dateString?: string | null, referenceDate?: Date): boolean {
  if (!dateString) return false;
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const ref = referenceDate || (typeof window === 'undefined' ? new Date('2026-10-15T12:00:00Z') : new Date());
    return isBefore(d, ref);
  } catch {
    return false;
  }
}

export function getTodayDateString(): string {
  if (typeof window === 'undefined') return '2026-10-15';
  return new Date().toISOString().split('T')[0];
}

export function generateId(prefix: string = 'id'): string {
  const rand = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${rand}`;
}

