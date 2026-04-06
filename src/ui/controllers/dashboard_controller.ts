import {
  AssetCategoryLevel,
  getSnapshotsPerCategoryLevel,
} from '../../lib/assets/asset_category.ts';
import type { BalanceSheet } from '../../lib/assets/balance_sheet.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import { AllocationLevel } from './allocations.ts';
import type { Allocations, AllocationEntry } from './allocations.ts';
import type { WealthSnapshot } from './wealth_snapshot.ts';
import type { WealthDelta } from './wealth_delta.ts';

function sheetTotalCents(sheet: BalanceSheet): number {
  return sheet.snapshots.reduce((sum, s) => sum + s.value.amount, 0);
}

export class DashboardController {
  private readonly latest: BalanceSheet;
  private readonly all: BalanceSheet[];

  constructor(repo: WealthRepository) {
    this.all = repo.getAllBalanceSheets();
    this.latest =
      repo.getLatestBalanceSheet() ??
      (() => {
        throw new Error('No balance sheets');
      })();
  }

  getTotalCents(): number {
    return sheetTotalCents(this.latest);
  }

  getDelta(): WealthDelta | null {
    if (this.all.length < 2) return null;
    const prev = sheetTotalCents(this.all.at(-2)!);
    const current = sheetTotalCents(this.latest);
    const cents = current - prev;
    return { cents, percentage: (cents / prev) * 100 };
  }

  getAllocations(): Allocations {
    const totalCents = sheetTotalCents(this.latest);

    const toEntries = (level: AssetCategoryLevel): readonly AllocationEntry[] =>
      getSnapshotsPerCategoryLevel(level, this.latest)
        .map(({ category, snapshots }) => {
          const cents = snapshots.reduce((sum, s) => sum + s.value.amount, 0);
          return {
            label: category.name,
            emoji: category.emoji,
            color: category.color,
            cents,
            percentage: (cents / totalCents) * 100,
          };
        })
        .sort((a, b) => b.cents - a.cents);

    const assetEntries: readonly AllocationEntry[] = [...this.latest.snapshots]
      .sort((a, b) => b.value.amount - a.value.amount)
      .map(({ asset, value }) => ({
        label: asset.name,
        emoji: asset.category.emoji,
        color: asset.category.color,
        cents: value.amount,
        percentage: (value.amount / totalCents) * 100,
      }));

    return {
      [AllocationLevel.Overview.id]: toEntries(AssetCategoryLevel.Overview),
      [AllocationLevel.Category.id]: toEntries(AssetCategoryLevel.Category),
      [AllocationLevel.Detail.id]: toEntries(AssetCategoryLevel.Detail),
      [AllocationLevel.Assets.id]: assetEntries,
    };
  }

  getWealthHistory(): WealthSnapshot[] {
    return this.all.map((sheet) => ({
      date: sheet.date,
      totalCents: sheetTotalCents(sheet),
    }));
  }
}
