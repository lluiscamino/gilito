import { SpreadsheetsApi } from './spreadsheets_api.ts';
import type { SheetRow } from './sheet_row.ts';

export class Sheet {
  private readonly api: SpreadsheetsApi;
  private readonly sheetId: number;
  readonly title: string;

  constructor(api: SpreadsheetsApi, sheetId: number, title: string) {
    this.api = api;
    this.sheetId = sheetId;
    this.title = title;
  }

  async read(): Promise<SheetRow[] | null> {
    return this.api.readValues(this.title);
  }

  async write(rows: SheetRow[]): Promise<void> {
    await this.api.updateCells(this.sheetId, rows);
  }
}
