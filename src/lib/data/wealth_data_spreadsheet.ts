import { collectAssets } from '../assets/balance_sheet.ts';
import type { BalanceSheet } from '../assets/balance_sheet.ts';
import { Spreadsheet } from '../google/sheets/spreadsheet.ts';
import { assertDefined } from '../utils/assert.ts';
import { AssetsMarshaller } from './assets_marshaller.ts';
import { BalanceSheetsMarshaller } from './balance_sheets_marshaller.ts';

const SPREADSHEET_NAME = 'gilito';
const DATA_SHEET = 'Data';
const ASSETS_SHEET = 'Assets';

// Layout
//
// "Data" sheet:
//   Row 1 (header): Date | asset-id-1 | asset-id-2 | ...
//   Row 2+:         <date serial> | <euros> | <euros> | ...
//
// "Assets" sheet:
//   Row 1 (header): ID | Name | Category
//   Row 2+:         id | name | category
//
// Dates are stored as Sheets serial numbers (days since Dec 30, 1899) so that
// date formatting applies. Money is stored as euros (cents / 100) so that
// currency formatting applies.

export class WealthDataSpreadsheet {
  private readonly spreadsheet: Spreadsheet;
  private readonly assetsMarshaller: AssetsMarshaller;
  private readonly balanceSheetsMarshaller: BalanceSheetsMarshaller;
  private balanceSheets: BalanceSheet[];

  private constructor(
    spreadsheet: Spreadsheet,
    assetsMarshaller: AssetsMarshaller,
    balanceSheetsMarshaller: BalanceSheetsMarshaller,
    balanceSheets: BalanceSheet[],
  ) {
    this.spreadsheet = spreadsheet;
    this.assetsMarshaller = assetsMarshaller;
    this.balanceSheetsMarshaller = balanceSheetsMarshaller;
    this.balanceSheets = balanceSheets;
  }

  getBalanceSheets(): BalanceSheet[] {
    return this.balanceSheets;
  }

  addBalanceSheet(balanceSheet: BalanceSheet): void {
    this.balanceSheets = [...this.balanceSheets, balanceSheet].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    this.persist();
  }

  updateBalanceSheet(balanceSheet: BalanceSheet): boolean {
    const idx = this.balanceSheets.findIndex(
      (s) => s.date.getTime() === balanceSheet.date.getTime(),
    );
    if (idx === -1) return false;
    this.balanceSheets = [
      ...this.balanceSheets.slice(0, idx),
      balanceSheet,
      ...this.balanceSheets.slice(idx + 1),
    ];
    this.persist();
    return true;
  }

  private persist(): void {
    this.writeAll().catch(console.error);
  }

  private async writeAll(): Promise<void> {
    await this.ensureSheetsExist();

    const dataSheet = assertDefined(
      this.spreadsheet.getSheet(DATA_SHEET),
      `Sheet "${DATA_SHEET}" not found`,
    );
    const assetsSheet = assertDefined(
      this.spreadsheet.getSheet(ASSETS_SHEET),
      `Sheet "${ASSETS_SHEET}" not found`,
    );

    const assets = collectAssets(this.balanceSheets);
    const assetIds = assets.map((a) => a.id);

    await this.spreadsheet.clearSheets([dataSheet, assetsSheet]);
    await dataSheet.write(this.balanceSheetsMarshaller.toSheetRows(this.balanceSheets, assetIds));
    await assetsSheet.write(this.assetsMarshaller.toSheetRows(assets));
  }

  private async ensureSheetsExist(): Promise<void> {
    const existing = new Set(this.spreadsheet.getSheets().map((s) => s.title));
    const missing = [DATA_SHEET, ASSETS_SHEET].filter((t) => !existing.has(t));
    if (missing.length > 0) await this.spreadsheet.addSheets(missing);
  }

  static async getOrCreate(token: string): Promise<WealthDataSpreadsheet> {
    const spreadsheet =
      (await Spreadsheet.getSpreadsheet(token, SPREADSHEET_NAME)) ??
      (await Spreadsheet.createNewSpreadsheet(token, SPREADSHEET_NAME, [DATA_SHEET, ASSETS_SHEET]));

    const assetsMarshaller = new AssetsMarshaller();
    const balanceSheetsMarshaller = new BalanceSheetsMarshaller();

    const assetsRows = (await spreadsheet.getSheet(ASSETS_SHEET)?.read()) ?? [];
    const dataRows = (await spreadsheet.getSheet(DATA_SHEET)?.read()) ?? [];

    const assets = assetsMarshaller.parse(assetsRows);
    const balanceSheets = balanceSheetsMarshaller.parse(dataRows, assets);

    return new WealthDataSpreadsheet(
      spreadsheet,
      assetsMarshaller,
      balanceSheetsMarshaller,
      balanceSheets,
    );
  }
}
