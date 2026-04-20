import type { Money } from 'ts-money';

export interface CurrencyConverter {
  toDisplayCurrency(money: Money): Money;
}
