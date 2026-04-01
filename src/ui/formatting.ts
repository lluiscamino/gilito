export function formatEur(cents: number): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function formatEurCompact(value: number): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
