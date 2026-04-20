import { Money } from 'ts-money';
import { Currency } from './currency.ts';
import type { CurrencyConverter } from './currency_converter.ts';

export const DISPLAY_CURRENCY = Currency.EUR;

export const ZERO_DISPLAY = new Money(0, DISPLAY_CURRENCY);

export function toDecimal(money: Money): number {
  return money.amount / 100;
}

export function sumInDisplayCurrency(
  moneys: readonly Money[],
  converter: CurrencyConverter,
): Money {
  return moneys.reduce(
    (sum, m) => new Money(sum.amount + converter.toDisplayCurrency(m).amount, DISPLAY_CURRENCY),
    ZERO_DISPLAY,
  );
}
