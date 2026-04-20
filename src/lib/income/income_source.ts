import type { Currency } from '../fx/currency.ts';

export interface IncomeSource {
  readonly id: string;
  readonly name: string;
  readonly currency: Currency;
}
