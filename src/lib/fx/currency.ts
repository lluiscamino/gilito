export const Currency = {
  EUR: 'EUR',
  USD: 'USD',
  GBP: 'GBP',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const SUPPORTED_CURRENCIES: readonly Currency[] = Object.values(Currency) as Currency[];

export function isCurrency(value: string): value is Currency {
  return value in Currency;
}
