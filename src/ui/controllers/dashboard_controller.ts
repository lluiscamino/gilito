import { Money } from 'ts-money';
import {
  AssetCategoryLevel,
  getSnapshotsPerCategoryLevel,
} from '../../lib/assets/asset_category.ts';
import type { BalanceSheet } from '../../lib/assets/balance_sheet.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import { DISPLAY_CURRENCY, sumInDisplayCurrency } from '../../lib/fx/money.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import { AllocationLevel } from './allocations.ts';
import type { Allocations, AllocationEntry } from './allocations.ts';
import type { WealthSnapshot } from './wealth_snapshot.ts';
import type { WealthDelta } from './wealth_delta.ts';

export class DashboardController {
  private readonly latest: BalanceSheet;
  private readonly all: BalanceSheet[];
  private readonly converter: CurrencyConverter;

  constructor(repo: WealthRepository, converter: CurrencyConverter) {
    this.all = repo.getAllBalanceSheets();
    this.latest =
      repo.getLatestBalanceSheet() ??
      (() => {
        throw new Error('No balance sheets');
      })();
    this.converter = converter;
  }

  private sheetTotal(sheet: BalanceSheet): Money {
    return sumInDisplayCurrency(
      sheet.snapshots.map((s) => s.value),
      this.converter,
    );
  }

  getTotal(): Money {
    return this.sheetTotal(this.latest);
  }

  getDelta(): WealthDelta | null {
    if (this.all.length < 2) return null;
    const prev = this.sheetTotal(this.all.at(-2)!);
    const current = this.sheetTotal(this.latest);
    const delta = new Money(current.amount - prev.amount, DISPLAY_CURRENCY);
    return { delta, percentage: (delta.amount / prev.amount) * 100 };
  }

  getAllocations(): Allocations {
    const total = this.sheetTotal(this.latest);

    const toEntries = (level: AssetCategoryLevel): readonly AllocationEntry[] =>
      getSnapshotsPerCategoryLevel(level, this.latest)
        .map(({ category, snapshots }) => {
          const amount = sumInDisplayCurrency(
            snapshots.map((s) => s.value),
            this.converter,
          );
          return {
            label: category.name,
            emoji: category.emoji,
            color: category.color,
            amount,
            percentage: total.amount > 0 ? (amount.amount / total.amount) * 100 : 0,
          };
        })
        .sort((a, b) => b.amount.amount - a.amount.amount);

    const assetEntries: readonly AllocationEntry[] = [...this.latest.snapshots]
      .sort((a, b) => b.value.amount - a.value.amount)
      .map(({ asset, value }) => {
        const amount = this.converter.toDisplayCurrency(value);
        return {
          label: asset.name,
          emoji: asset.category.emoji,
          color: asset.category.color,
          amount,
          percentage: total.amount > 0 ? (amount.amount / total.amount) * 100 : 0,
        };
      });

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
      total: this.sheetTotal(sheet),
    }));
  }
}
