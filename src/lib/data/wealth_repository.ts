import type { BalanceSheet } from '../assets/balance_sheet.ts';
import type { IncomeSheet } from '../income/income_sheet.ts';
import type { Currency } from '../fx/currency.ts';

export interface WealthRepository {
  getAllBalanceSheets(): BalanceSheet[];
  getLatestBalanceSheet(): BalanceSheet | undefined;
  addBalanceSheet(balanceSheet: BalanceSheet): void;
  updateBalanceSheet(balanceSheet: BalanceSheet): void;

  getAllIncomeSheets(): IncomeSheet[];
  getLatestIncomeSheet(): IncomeSheet | undefined;
  addIncomeSheet(sheet: IncomeSheet): void;
  updateIncomeSheet(sheet: IncomeSheet): void;
  updateIncomeSource(sourceId: string, currency: Currency): void;
}
