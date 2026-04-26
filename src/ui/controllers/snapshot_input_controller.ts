import { fromDecimal } from '../../lib/fx/money.ts';
import {
  findCategoryById,
  isValidCategoryId,
  leafCategories,
} from '../../lib/assets/asset_category.ts';
import type { AssetCategory } from '../../lib/assets/asset_category.ts';
import type { Asset } from '../../lib/assets/asset.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { EntryInput } from './entry_input.ts';
import type { NewAssetValue } from './new_asset_value.ts';

export class SnapshotInputController {
  private readonly repo: WealthRepository;

  constructor(repo: WealthRepository) {
    this.repo = repo;
  }

  getEntryInputs(): EntryInput[] {
    const latest = this.repo.getLatestBalanceSheet();
    if (!latest) return [];
    return latest.snapshots.map((s) => ({
      id: s.asset.id,
      name: s.asset.name,
      lastValue: s.value,
    }));
  }

  getCategories(): AssetCategory[] {
    return leafCategories();
  }

  saveSnapshot(
    date: Date,
    values: ReadonlyMap<string, number>,
    newAssets: readonly NewAssetValue[],
  ): void {
    const latest = this.repo.getLatestBalanceSheet();

    const snapshots = latest
      ? latest.snapshots.map((s) => {
          const amount = values.get(s.asset.id);
          const value = amount !== undefined ? fromDecimal(amount, s.asset.currency) : s.value;
          return { asset: s.asset, value };
        })
      : [];

    for (const newAsset of newAssets) {
      if (!isValidCategoryId(newAsset.categoryId)) continue;
      const category = findCategoryById(newAsset.categoryId);
      const asset: Asset = {
        id: `${newAsset.name}-${category.id}-${Date.now()}`,
        name: newAsset.name,
        category,
        currency: newAsset.currency,
      };
      snapshots.push({
        asset,
        value: fromDecimal(newAsset.amount, newAsset.currency),
      });
    }

    this.repo.addBalanceSheet({ date, snapshots });
  }
}
