import type { Money } from 'ts-money';
import type { Currency } from './currency.ts';

export interface CurrencyConverter {
  toCurrency(money: Money, currency: Currency): Money;
}
