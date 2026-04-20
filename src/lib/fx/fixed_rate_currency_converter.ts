import { Money } from 'ts-money';
import { Currency } from './currency.ts';
import { DISPLAY_CURRENCY } from './money.ts';
import type { CurrencyConverter } from './currency_converter.ts';

export class FixedRateCurrencyConverter implements CurrencyConverter {
  private readonly rates: ReadonlyMap<Currency, number>;

  private constructor(rates: Partial<Record<Currency, number>>) {
    this.rates = new Map(Object.entries(rates) as [Currency, number][]);
  }

  toDisplayCurrency(money: Money): Money {
    if (money.currency === DISPLAY_CURRENCY) return money;
    const rate = this.rates.get(money.currency as Currency);
    if (rate === undefined) throw new Error(`No EUR rate for currency: ${money.currency}`);
    return new Money(Math.round(money.amount * rate), DISPLAY_CURRENCY);
  }

  // Update rates here as needed (currency → EUR, e.g. 1 USD = 0.92 EUR)
  static create(): FixedRateCurrencyConverter {
    return new FixedRateCurrencyConverter({
      [Currency.USD]: 0.92,
      [Currency.GBP]: 1.17,
    });
  }
}
