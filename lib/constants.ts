// ── Pricing ────────────────────────────────────────────────────────────────
export const RATE_PER_MILE = Number(process.env.NEXT_PUBLIC_RATE_PER_MILE) || 2.0;
export const SERVICE_FEE   = Number(process.env.NEXT_PUBLIC_SERVICE_FEE)   || 0.1;

// ── Payment handles ─────────────────────────────────────────────────────────
export const PAYMENT_INFO = {
  venmo:   { name: 'Venmo',    handle: process.env.NEXT_PUBLIC_VENMO   || '@QuikTransit',      emoji: '💜' },
  paypal:  { name: 'PayPal',   handle: process.env.NEXT_PUBLIC_PAYPAL  || 'rmusil2@gmail.com', emoji: '🔵' },
  zelle:   { name: 'Zelle',    handle: process.env.NEXT_PUBLIC_ZELLE   || '714-292-1804',      emoji: '💜' },
  cashapp: { name: 'Cash App', handle: process.env.NEXT_PUBLIC_CASHAPP || '$QuikTransit',      emoji: '💚' },
} as const;

export type PayMethod = keyof typeof PAYMENT_INFO;
export type BookingType = 'ride' | 'package';
export type BookingStatus = 'pending' | 'confirmed' | 'en_route' | 'arrived' | 'complete';

// ── Shared types ─────────────────────────────────────────────────────────────
export interface Booking {
  id: string;
  type: BookingType;
  status: BookingStatus;
  fromAddress: string;
  toAddress: string;
  miles: number;
  minutes: number;
  baseFare: number;
  serviceFee: number;
  tip: number;
  total: number;
  payMethod: PayMethod;
  customerName?: string;
  customerPhone?: string;
  packageNotes?: string;
  createdAt: string;
}

// ── Fare helpers ─────────────────────────────────────────────────────────────
export function calcFare(miles: number) {
  const base = Math.round(miles * RATE_PER_MILE * 100) / 100;
  const fee  = Math.round(base * SERVICE_FEE * 100) / 100;
  return { base, fee, total: Math.round((base + fee) * 100) / 100 };
}

export function formatCurrency(n: number) {
  return '$' + n.toFixed(2);
}

export function generateId() {
  return 'qt_' + Math.random().toString(36).slice(2, 10).toUpperCase();
}
