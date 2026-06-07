import { describe, it, expect } from 'vitest';
import { Money } from 'ts-money';
import { DashboardController } from './dashboard_controller.ts';
import { findCategoryById } from '../../lib/assets/asset_category.ts';
import type { BalanceSheet } from '../../lib/assets/balance_sheet.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import type { Currency } from '../../lib/fx/currency.ts';

const makeSheet = (entries: { assetId: string; currency: Currency }[]): BalanceSheet => ({
  date: new Date('2024-01-01'),
  snapshots: entries.map(({ assetId, currency }) => ({
    asset: {
      id: assetId,
      name: assetId,
      category: findCategoryById('defensive.cash.current'),
      currency,
    },
    value: new Money(100, currency),
  })),
});

const makeRepo = (latest: BalanceSheet): WealthRepository => ({
  getSpreadsheetUrl: () => '',
  getAllBalanceSheets: () => [latest],
  getLatestBalanceSheet: () => latest,
  addBalanceSheet: () => {},
  updateBalanceSheet: () => {},
  getAllIncomeSheets: () => [],
  getLatestIncomeSheet: () => undefined,
  addIncomeSheet: () => {},
  updateIncomeSheet: () => {},
});

const identityConverter: CurrencyConverter = {
  toCurrency: (money) => money,
};

describe('getCurrencyAllocations', () => {
  it('returns null when every asset uses the same currency', () => {
    const sheet = makeSheet([
      { assetId: 'a1', currency: 'EUR' },
      { assetId: 'a2', currency: 'EUR' },
    ]);
    const controller = new DashboardController(makeRepo(sheet), identityConverter, 'EUR');

    expect(controller.getCurrencyAllocations()).toBeNull();
  });

  it('returns one entry per currency when assets span multiple currencies', () => {
    const sheet = makeSheet([
      { assetId: 'a1', currency: 'EUR' },
      { assetId: 'a2', currency: 'USD' },
    ]);
    const controller = new DashboardController(makeRepo(sheet), identityConverter, 'EUR');

    const allocations = controller.getCurrencyAllocations();
    expect(allocations?.map((a) => a.label)).toEqual(expect.arrayContaining(['EUR', 'USD']));
    expect(allocations).toHaveLength(2);
  });
});
