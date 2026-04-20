import type { AssetCategory } from './asset_category.ts';
import type { Currency } from '../fx/currency.ts';

export interface Asset {
  readonly id: string;
  readonly name: string;
  readonly category: AssetCategory;
  readonly currency: Currency;
}
