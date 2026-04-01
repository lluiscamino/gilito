import { AssetCategory } from './asset_category.ts';
import type { Asset } from './asset.ts';

export interface CashAccount extends Asset {
  readonly category: typeof AssetCategory.CASH;
  readonly currency: string;
}
