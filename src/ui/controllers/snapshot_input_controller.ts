import { Money, Currencies } from 'ts-money';
import type { Asset } from '../../lib/assets/asset.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { AssetInput } from './asset_input.ts';
import type { NewAssetValue } from './new_asset_value.ts';

export class SnapshotInputController {
  private readonly repo: WealthRepository;

  constructor(repo: WealthRepository) {
    this.repo = repo;
  }

  getAssetInputs(): AssetInput[] {
    const latest = this.repo.getLatestBalanceSheet();
    if (!latest) return [];
    return latest.snapshots.map((s) => ({
      id: s.asset.id,
      name: s.asset.name,
      lastCents: s.value.amount,
    }));
  }

  saveSnapshot(
    date: Date,
    values: ReadonlyMap<string, number>,
    newAssets: readonly NewAssetValue[],
  ): void {
    const latest = this.repo.getLatestBalanceSheet();

    const snapshots = latest
      ? latest.snapshots.map((s) => {
          const euros = values.get(s.asset.id);
          const cents = euros !== undefined ? Math.round(euros * 100) : s.value.amount;
          return { asset: s.asset, value: new Money(cents, Currencies.EUR) };
        })
      : [];

    for (const newAsset of newAssets) {
      const asset: Asset = {
        id: `${newAsset.name}-${newAsset.category.id}-${Date.now()}`,
        name: newAsset.name,
        category: newAsset.category,
      };
      snapshots.push({ asset, value: new Money(Math.round(newAsset.euros * 100), Currencies.EUR) });
    }

    this.repo.addBalanceSheet({ date, snapshots });
  }
}
