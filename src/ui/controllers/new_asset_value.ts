import type { AssetCategory } from '../../lib/assets/asset_category.ts';

export interface NewAssetValue {
  readonly name: string;
  readonly category: AssetCategory;
  readonly euros: number;
}
