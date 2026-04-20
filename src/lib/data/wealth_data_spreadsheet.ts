import { collectAssets } from '../assets/balance_sheet.ts';
import type { BalanceSheet } from '../assets/balance_sheet.ts';
import { collectSources } from '../income/income_sheet.ts';
import type { IncomeSheet } from '../income/income_sheet.ts';
import { Spreadsheet } from '../google/sheets/spreadsheet.ts';
import { assertDefined } from '../utils/assert.ts';
import { AssetsMarshaller } from './assets_marshaller.ts';
import { BalanceSheetsMarshaller } from './balance_sheets_marshaller.ts';
import { IncomeSourcesMarshaller } from './income_sources_marshaller.ts';
import { IncomeSheetsMarshaller } from './income_sheets_marshaller.ts';

const SPREADSHEET_NAME = 'gilito';
const DATA_SHEET = 'AssetSnapshots';
const ASSETS_SHEET = 'Assets';
const INCOME_SHEET = 'Income';
const INCOME_SOURCES_SHEET = 'IncomeSources';

// Layout
//
// "AssetSnapshots" sheet:
//   Row 1 (header): Date | asset-id-1 | asset-id-2 | ...
//   Row 2+:         <date serial> | <euros> | <euros> | ...
//
// "Assets" sheet:
//   Row 1 (header): ID | Name | Category
//   Row 2+:         id | name | category
//
// "Income" sheet:
//   Row 1 (header): Date | source-id-1 | source-id-2 | ...
//   Row 2+:         <date serial> | <euros> | <euros> | ...
//
// "IncomeSources" sheet:
//   Row 1 (header): ID | Name
//   Row 2+:         id | name
//
// Dates are stored as Sheets serial numbers (days since Dec 30, 1899) so that
// date formatting applies. Money is stored as euros (cents / 100) so that
// currency formatting applies.

export class WealthDataSpreadsheet {
  private readonly spreadsheet: Spreadsheet;
  private readonly assetsMarshaller: AssetsMarshaller;
  private readonly balanceSheetsMarshaller: BalanceSheetsMarshaller;
  private readonly incomeSourcesMarshaller: IncomeSourcesMarshaller;
  private readonly incomeSheetsMarshaller: IncomeSheetsMarshaller;
  private balanceSheets: BalanceSheet[];
  private incomeSheets: IncomeSheet[];

  private constructor(
    spreadsheet: Spreadsheet,
    assetsMarshaller: AssetsMarshaller,
    balanceSheetsMarshaller: BalanceSheetsMarshaller,
    incomeSourcesMarshaller: IncomeSourcesMarshaller,
    incomeSheetsMarshaller: IncomeSheetsMarshaller,
    balanceSheets: BalanceSheet[],
    incomeSheets: IncomeSheet[],
  ) {
    this.spreadsheet = spreadsheet;
    this.assetsMarshaller = assetsMarshaller;
    this.balanceSheetsMarshaller = balanceSheetsMarshaller;
    this.incomeSourcesMarshaller = incomeSourcesMarshaller;
    this.incomeSheetsMarshaller = incomeSheetsMarshaller;
    this.balanceSheets = balanceSheets;
    this.incomeSheets = incomeSheets;
  }

  getBalanceSheets(): BalanceSheet[] {
    return this.balanceSheets;
  }

  addBalanceSheet(balanceSheet: BalanceSheet): void {
    this.balanceSheets = [...this.balanceSheets, balanceSheet].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    this.persistWealth();
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
    this.persistWealth();
    return true;
  }

  getIncomeSheets(): IncomeSheet[] {
    return this.incomeSheets;
  }

  addIncomeSheet(sheet: IncomeSheet): void {
    this.incomeSheets = [...this.incomeSheets, sheet].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    this.persistIncome();
  }

  updateIncomeSheet(sheet: IncomeSheet): boolean {
    const idx = this.incomeSheets.findIndex((s) => s.date.getTime() === sheet.date.getTime());
    if (idx === -1) return false;
    this.incomeSheets = [
      ...this.incomeSheets.slice(0, idx),
      sheet,
      ...this.incomeSheets.slice(idx + 1),
    ];
    this.persistIncome();
    return true;
  }

  private persistWealth(): void {
    this.writeWealth().catch(console.error);
  }

  private persistIncome(): void {
    this.writeIncome().catch(console.error);
  }

  private async writeWealth(): Promise<void> {
    await this.ensureSheetsExist([DATA_SHEET, ASSETS_SHEET]);

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

  private async writeIncome(): Promise<void> {
    await this.ensureSheetsExist([INCOME_SHEET, INCOME_SOURCES_SHEET]);

    const incomeSheet = assertDefined(
      this.spreadsheet.getSheet(INCOME_SHEET),
      `Sheet "${INCOME_SHEET}" not found`,
    );
    const incomeSourcesSheet = assertDefined(
      this.spreadsheet.getSheet(INCOME_SOURCES_SHEET),
      `Sheet "${INCOME_SOURCES_SHEET}" not found`,
    );

    const sources = collectSources(this.incomeSheets);
    const sourceIds = sources.map((s) => s.id);

    await this.spreadsheet.clearSheets([incomeSheet, incomeSourcesSheet]);
    await incomeSheet.write(this.incomeSheetsMarshaller.toSheetRows(this.incomeSheets, sourceIds));
    await incomeSourcesSheet.write(this.incomeSourcesMarshaller.toSheetRows(sources));
  }

  private async ensureSheetsExist(titles: string[]): Promise<void> {
    const existing = new Set(this.spreadsheet.getSheets().map((s) => s.title));
    const missing = titles.filter((t) => !existing.has(t));
    if (missing.length > 0) await this.spreadsheet.addSheets(missing);
  }

  static async getOrCreate(token: string): Promise<WealthDataSpreadsheet> {
    const spreadsheet =
      (await Spreadsheet.getSpreadsheet(token, SPREADSHEET_NAME)) ??
      (await Spreadsheet.createNewSpreadsheet(token, SPREADSHEET_NAME, [
        DATA_SHEET,
        ASSETS_SHEET,
        INCOME_SHEET,
        INCOME_SOURCES_SHEET,
      ]));

    const assetsMarshaller = new AssetsMarshaller();
    const balanceSheetsMarshaller = new BalanceSheetsMarshaller();
    const incomeSourcesMarshaller = new IncomeSourcesMarshaller();
    const incomeSheetsMarshaller = new IncomeSheetsMarshaller();

    const assetsRows = (await spreadsheet.getSheet(ASSETS_SHEET)?.read()) ?? [];
    const dataRows = (await spreadsheet.getSheet(DATA_SHEET)?.read()) ?? [];
    const incomeSourcesRows = (await spreadsheet.getSheet(INCOME_SOURCES_SHEET)?.read()) ?? [];
    const incomeRows = (await spreadsheet.getSheet(INCOME_SHEET)?.read()) ?? [];

    const assets = assetsMarshaller.parse(assetsRows);
    const balanceSheets = balanceSheetsMarshaller.parse(dataRows, assets);
    const incomeSources = incomeSourcesMarshaller.parse(incomeSourcesRows);
    const incomeSheets = incomeSheetsMarshaller.parse(incomeRows, incomeSources);

    return new WealthDataSpreadsheet(
      spreadsheet,
      assetsMarshaller,
      balanceSheetsMarshaller,
      incomeSourcesMarshaller,
      incomeSheetsMarshaller,
      balanceSheets,
      incomeSheets,
    );
  }
}
