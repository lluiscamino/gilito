import type { BalanceSheet } from '../assets/balance_sheet.ts';

export interface WealthRepository {
  getAllBalanceSheets(): BalanceSheet[];
  getLatestBalanceSheet(): BalanceSheet | undefined;
  addBalanceSheet(balanceSheet: BalanceSheet): void;
  updateBalanceSheet(balanceSheet: BalanceSheet): void;
}
