import type { AssetCategory } from '../assets/asset_category.ts';
import type { BalanceSheet } from '../assets/balance_sheet.ts';
import type { IncomeSheet } from '../income/income_sheet.ts';
import type { Currency } from '../fx/currency.ts';

export interface WealthRepository {
  getAllBalanceSheets(): BalanceSheet[];
  getLatestBalanceSheet(): BalanceSheet | undefined;
  addBalanceSheet(balanceSheet: BalanceSheet): void;
  updateBalanceSheet(balanceSheet: BalanceSheet): void;
  updateAsset(assetId: string, category: AssetCategory, currency: Currency): void;

  getAllIncomeSheets(): IncomeSheet[];
  getLatestIncomeSheet(): IncomeSheet | undefined;
  addIncomeSheet(sheet: IncomeSheet): void;
  updateIncomeSheet(sheet: IncomeSheet): void;
}
