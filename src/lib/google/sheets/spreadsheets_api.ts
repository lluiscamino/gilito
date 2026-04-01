import { getJson, postJson } from '../../utils/net.ts';
import type { CellFormat, SheetRow } from './sheet_row.ts';
import type { GridRange } from './grid_range.ts';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SheetInfo {
  sheetId: number;
  title: string;
}

type ApiGridRange = GridRange & { sheetId?: number };

export async function createSpreadsheet(
  token: string,
  title: string,
  sheetTitles: string[],
): Promise<{ id: string; sheets: SheetInfo[] }> {
  const data = await postJson<{ spreadsheetId: string; sheets: { properties: SheetInfo }[] }>(
    SHEETS_API,
    { properties: { title }, sheets: sheetTitles.map((t) => ({ properties: { title: t } })) },
    { bearerToken: token },
  );
  return { id: data.spreadsheetId, sheets: data.sheets.map((s) => s.properties) };
}

export class SpreadsheetsApi {
  private readonly token: string;
  readonly spreadsheetId: string;

  constructor(token: string, spreadsheetId: string) {
    this.token = token;
    this.spreadsheetId = spreadsheetId;
  }

  async getSheets(): Promise<SheetInfo[]> {
    const data = await getJson<{ sheets: { properties: SheetInfo }[] }>(
      `${SHEETS_API}/${this.spreadsheetId}?fields=sheets.properties`,
      { bearerToken: this.token },
    );
    return data.sheets.map((s) => s.properties);
  }

  async addSheets(titles: string[]): Promise<SheetInfo[]> {
    const data = await postJson<{ replies: { addSheet?: { properties: SheetInfo } }[] }>(
      `${SHEETS_API}/${this.spreadsheetId}:batchUpdate`,
      { requests: titles.map((title) => ({ addSheet: { properties: { title } } })) },
      { bearerToken: this.token },
    );
    return data.replies.map((r) => r.addSheet?.properties).filter((p): p is SheetInfo => p != null);
  }

  async batchClearValues(ranges: string[]): Promise<void> {
    await postJson(
      `${SHEETS_API}/${this.spreadsheetId}/values:batchClear`,
      { ranges },
      { bearerToken: this.token },
    );
  }

  async readValues(range: string): Promise<SheetRow[] | null> {
    const data = await getJson<{ values?: (string | number)[][]; error?: unknown }>(
      `${SHEETS_API}/${this.spreadsheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
      { bearerToken: this.token },
    );
    if (data.error) return null;
    return (data.values ?? []).map((row) => row.map((v) => ({ value: v })));
  }

  async updateCells(sheetId: number, rows: SheetRow[]): Promise<void> {
    await postJson(
      `${SHEETS_API}/${this.spreadsheetId}:batchUpdate`,
      {
        requests: [
          {
            updateCells: {
              rows: rows.map((row) => ({ values: row.map(toApiCell) })),
              fields: 'userEnteredValue,userEnteredFormat.numberFormat',
              start: { sheetId, rowIndex: 0, columnIndex: 0 },
            },
          },
        ],
      },
      { bearerToken: this.token },
    );
  }

  async formatCells(requests: Array<{ range: ApiGridRange; format: CellFormat }>): Promise<void> {
    await postJson(
      `${SHEETS_API}/${this.spreadsheetId}:batchUpdate`,
      {
        requests: requests.map(({ range, format }) => ({
          repeatCell: {
            range,
            cell: { userEnteredFormat: format },
            fields: 'userEnteredFormat.numberFormat',
          },
        })),
      },
      { bearerToken: this.token },
    );
  }
}

function toApiCell({ value, format }: SheetRow[number]) {
  return {
    userEnteredValue: typeof value === 'string' ? { stringValue: value } : { numberValue: value },
    ...(format && { userEnteredFormat: format }),
  };
}
