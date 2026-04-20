import type { Currency } from '../../lib/fx/currency.ts';

export interface NewAssetValue {
  readonly name: string;
  readonly categoryId: string;
  readonly amount: number;
  readonly currency: Currency;
}
