import { AssetCategory } from '../../lib/assets/asset_category.ts';
import type { BalanceSheet } from '../../lib/assets/balance_sheet.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { CategoryAllocation } from './category_allocation.ts';
import type { WealthSnapshot } from './wealth_snapshot.ts';
import type { WealthDelta } from './wealth_delta.ts';

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  [AssetCategory.CASH]: { label: 'Cash', emoji: '💰', color: '#007AFF' },
  [AssetCategory.STOCKS]: { label: 'Stocks', emoji: '📈', color: '#5E5CE6' },
  [AssetCategory.PROPERTY]: { label: 'Property', emoji: '🏠', color: '#34C759' },
  [AssetCategory.CRYPTO]: { label: 'Crypto', emoji: '🪙', color: '#F7931A' },
};

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

  getAllocations(): CategoryAllocation[] {
    const total = sheetTotalCents(this.latest);
    const totals = new Map<string, number>();
    for (const { asset, value } of this.latest.snapshots) {
      totals.set(asset.category, (totals.get(asset.category) ?? 0) + value.amount);
    }
    return [...totals.entries()].map(([cat, cents]) => {
      const meta = CATEGORY_META[cat] ?? { label: cat, emoji: '', color: '#888' };
      return { ...meta, cents, percentage: (cents / total) * 100 };
    });
  }

  getWealthHistory(): WealthSnapshot[] {
    return this.all.map((sheet) => ({
      date: sheet.date,
      totalCents: sheetTotalCents(sheet),
    }));
  }
}
