import { SpreadsheetsApi, createSpreadsheet } from './spreadsheets_api.ts';
import { DriveApi } from './drive_api.ts';
import { Sheet } from './sheet.ts';
import type { SheetInfo } from './spreadsheets_api.ts';

export class Spreadsheet {
  private readonly api: SpreadsheetsApi;
  private sheets: Sheet[];

  private constructor(api: SpreadsheetsApi, sheets: Sheet[]) {
    this.api = api;
    this.sheets = sheets;
  }

  getSheets(): Sheet[] {
    return this.sheets;
  }

  getSheet(title: string): Sheet | undefined {
    return this.sheets.find((s) => s.title === title);
  }

  async addSheets(titles: string[]): Promise<Sheet[]> {
    const added = Spreadsheet.toSheets(this.api, await this.api.addSheets(titles));
    this.sheets = [...this.sheets, ...added];
    return added;
  }

  async clearSheets(sheets: Sheet[]): Promise<void> {
    await this.api.batchClearValues(sheets.map((s) => s.title));
  }

  static async getSpreadsheet(token: string, name: string): Promise<Spreadsheet | null> {
    const id = await new DriveApi(token).findSpreadsheetId(name);
    if (!id) return null;
    const api = new SpreadsheetsApi(token, id);
    return new Spreadsheet(api, Spreadsheet.toSheets(api, await api.getSheets()));
  }

  static async createNewSpreadsheet(
    token: string,
    name: string,
    sheetTitles: string[],
  ): Promise<Spreadsheet> {
    const { id, sheets } = await createSpreadsheet(token, name, sheetTitles);
    const api = new SpreadsheetsApi(token, id);
    return new Spreadsheet(api, Spreadsheet.toSheets(api, sheets));
  }

  private static toSheets(api: SpreadsheetsApi, infos: SheetInfo[]): Sheet[] {
    return infos.map((info) => new Sheet(api, info.sheetId, info.title));
  }
}
