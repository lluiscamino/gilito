import { Money } from 'ts-money';
import { Currency } from './currency.ts';
import type { CurrencyConverter } from './currency_converter.ts';

export function toDecimal(money: Money): number {
  return money.amount / 100;
}

export function fromDecimal(amount: number, currency: Currency): Money {
  return new Money(Math.round(amount * 100), currency);
}

export function sumInDisplayCurrency(
  moneys: readonly Money[],
  converter: CurrencyConverter,
  displayCurrency: Currency,
): Money {
  return moneys.reduce(
    (sum, m) =>
      new Money(sum.amount + converter.toCurrency(m, displayCurrency).amount, displayCurrency),
    new Money(0, displayCurrency),
  );
}
