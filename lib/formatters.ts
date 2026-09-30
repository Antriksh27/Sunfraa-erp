/**
 * Deterministic formatters to prevent React hydration mismatch between SSR & Client
 */

export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0';
  }
  return Number(amount).toLocaleString('en-IN');
}

export function formatCrores(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0.00 Cr';
  }
  const num = Number(amount);
  return `₹${(num / 10000000).toFixed(2)} Cr`;
}
