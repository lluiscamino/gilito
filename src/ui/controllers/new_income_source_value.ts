import type { Currency } from '../../lib/fx/currency.ts';

export interface NewIncomeSourceValue {
  readonly name: string;
  readonly amount: number;
  readonly currency: Currency;
}
