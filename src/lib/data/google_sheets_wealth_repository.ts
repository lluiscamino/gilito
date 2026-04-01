import type { BalanceSheet } from '../assets/balance_sheet.ts';
import type { WealthRepository } from './wealth_repository.ts';
import { WealthDataSpreadsheet } from './wealth_data_spreadsheet.ts';

export class GoogleSheetsWealthRepository implements WealthRepository {
  private readonly dataSpreadsheet: WealthDataSpreadsheet;

  private constructor(dataSpreadsheet: WealthDataSpreadsheet) {
    this.dataSpreadsheet = dataSpreadsheet;
  }

  static async create(token: string): Promise<GoogleSheetsWealthRepository> {
    return new GoogleSheetsWealthRepository(await WealthDataSpreadsheet.getOrCreate(token));
  }

  getAllBalanceSheets(): BalanceSheet[] {
    return this.dataSpreadsheet.getBalanceSheets();
  }

  getLatestBalanceSheet(): BalanceSheet | undefined {
    return this.dataSpreadsheet.getBalanceSheets().at(-1);
  }

  addBalanceSheet(sheet: BalanceSheet): void {
    this.dataSpreadsheet.addBalanceSheet(sheet);
  }

  updateBalanceSheet(sheet: BalanceSheet): void {
    this.dataSpreadsheet.updateBalanceSheet(sheet);
  }
}
