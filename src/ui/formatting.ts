import type { Money } from 'ts-money';
import { toDecimal } from '../lib/fx/money.ts';

export { toDecimal };

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency: money.currency }).format(
    toDecimal(money),
  );
}

export function formatMoneyCompact(money: Money): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: money.currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(toDecimal(money));
}

export function getCurrencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? currency
  );
}

/** Parses a numeric string input, returning `fallback` if empty or invalid. */
export function parseDecimalInput(raw: string, fallback: number): number {
  const trimmed = raw.trim();
  if (trimmed === '') return fallback;
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? fallback : parsed;
}
