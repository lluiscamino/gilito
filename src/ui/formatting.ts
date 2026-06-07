import type { Money } from 'ts-money';
import { toDecimal, fromDecimal } from '../lib/fx/money.ts';
import type { Currency } from '../lib/fx/currency.ts';

export { toDecimal, fromDecimal };

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

const CURRENCY_STYLES: Record<Currency, { emoji: string; color: string }> = {
  EUR: { emoji: '🇪🇺', color: '#2C7BE5' },
  USD: { emoji: '🇺🇸', color: '#34C759' },
  GBP: { emoji: '🇬🇧', color: '#AF52DE' },
};

export function getCurrencyStyle(currency: Currency): { emoji: string; color: string } {
  return CURRENCY_STYLES[currency];
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
