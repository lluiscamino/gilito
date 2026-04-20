import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpreadsheetsApi, createSpreadsheet } from './spreadsheets_api.ts';
import { getJson, postJson } from '../../utils/net.ts';

vi.mock('../../utils/net.ts', () => ({ getJson: vi.fn(), postJson: vi.fn() }));

const API = 'https://sheets.googleapis.com/v4/spreadsheets';

describe('createSpreadsheet', () => {
  beforeEach(() => vi.mocked(postJson).mockReset());

  it('posts to the Sheets API with the title and sheet titles', async () => {
    vi.mocked(postJson).mockResolvedValue({
      spreadsheetId: 'new-id',
      sheets: [],
    });
    await createSpreadsheet('tok', 'My Sheet', ['Data', 'Assets']);
    expect(postJson).toHaveBeenCalledWith(
      API,
      {
        properties: { title: 'My Sheet' },
        sheets: [{ properties: { title: 'Data' } }, { properties: { title: 'Assets' } }],
      },
      { bearerToken: 'tok' },
    );
  });

  it('returns the spreadsheet id and mapped sheet info', async () => {
    vi.mocked(postJson).mockResolvedValue({
      spreadsheetId: 'abc123',
      sheets: [
        { properties: { sheetId: 1, title: 'Data' } },
        { properties: { sheetId: 2, title: 'Assets' } },
      ],
    });
    const result = await createSpreadsheet('tok', 'title', ['Data', 'Assets']);
    expect(result).toEqual({
      id: 'abc123',
      sheets: [
        { sheetId: 1, title: 'Data' },
        { sheetId: 2, title: 'Assets' },
      ],
    });
  });
});

describe('SpreadsheetsApi', () => {
  const api = new SpreadsheetsApi('my-token', 'sid');

  beforeEach(() => {
    vi.mocked(getJson).mockReset();
    vi.mocked(postJson).mockReset();
  });

  describe('getSheets', () => {
    it('fetches from the correct URL with fields parameter', async () => {
      vi.mocked(getJson).mockResolvedValue({ sheets: [] });
      await api.getSheets();
      expect(getJson).toHaveBeenCalledWith(`${API}/sid?fields=sheets.properties`, {
        bearerToken: 'my-token',
      });
    });

    it('returns the mapped sheet info', async () => {
      vi.mocked(getJson).mockResolvedValue({
        sheets: [
          { properties: { sheetId: 1, title: 'Data' } },
          { properties: { sheetId: 2, title: 'Assets' } },
        ],
      });
      const sheets = await api.getSheets();
      expect(sheets).toEqual([
        { sheetId: 1, title: 'Data' },
        { sheetId: 2, title: 'Assets' },
      ]);
    });
  });

  describe('addSheets', () => {
    it('posts an addSheet request for each title to batchUpdate', async () => {
      vi.mocked(postJson).mockResolvedValue({ replies: [] });
      await api.addSheets(['Sheet1', 'Sheet2']);
      expect(postJson).toHaveBeenCalledWith(
        `${API}/sid:batchUpdate`,
        {
          requests: [
            { addSheet: { properties: { title: 'Sheet1' } } },
            { addSheet: { properties: { title: 'Sheet2' } } },
          ],
        },
        { bearerToken: 'my-token' },
      );
    });

    it('returns the sheet info from replies', async () => {
      vi.mocked(postJson).mockResolvedValue({
        replies: [
          { addSheet: { properties: { sheetId: 10, title: 'Sheet1' } } },
          { addSheet: { properties: { sheetId: 11, title: 'Sheet2' } } },
        ],
      });
      const added = await api.addSheets(['Sheet1', 'Sheet2']);
      expect(added).toEqual([
        { sheetId: 10, title: 'Sheet1' },
        { sheetId: 11, title: 'Sheet2' },
      ]);
    });

    it('filters out replies that do not contain addSheet', async () => {
      vi.mocked(postJson).mockResolvedValue({
        replies: [{}, { addSheet: { properties: { sheetId: 10, title: 'Sheet1' } } }],
      });
      const added = await api.addSheets(['Sheet1']);
      expect(added).toEqual([{ sheetId: 10, title: 'Sheet1' }]);
    });
  });

  describe('batchClearValues', () => {
    it('posts to the values:batchClear endpoint with the given ranges', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      await api.batchClearValues(['Sheet1', 'Sheet2']);
      expect(postJson).toHaveBeenCalledWith(
        `${API}/sid/values:batchClear`,
        { ranges: ['Sheet1', 'Sheet2'] },
        { bearerToken: 'my-token' },
      );
    });
  });

  describe('readValues', () => {
    it('fetches from the correct URL with UNFORMATTED_VALUE rendering', async () => {
      vi.mocked(getJson).mockResolvedValue({ values: [] });
      await api.readValues('MySheet');
      expect(getJson).toHaveBeenCalledWith(
        `${API}/sid/values/MySheet?valueRenderOption=UNFORMATTED_VALUE`,
        { bearerToken: 'my-token' },
      );
    });

    it('maps the response values to SheetRow format', async () => {
      vi.mocked(getJson).mockResolvedValue({
        values: [
          ['Date', 'cash'],
          [45292, 1000],
        ],
      });
      const rows = await api.readValues('Sheet1');
      expect(rows).toEqual([
        [{ value: 'Date' }, { value: 'cash' }],
        [{ value: 45292 }, { value: 1000 }],
      ]);
    });

    it('returns an empty array when values is absent from the response', async () => {
      vi.mocked(getJson).mockResolvedValue({});
      expect(await api.readValues('Sheet1')).toEqual([]);
    });

    it('returns null when the response contains an error', async () => {
      vi.mocked(getJson).mockResolvedValue({ error: { code: 404, message: 'Not found' } });
      expect(await api.readValues('Sheet1')).toBeNull();
    });
  });

  describe('updateCells', () => {
    it('resizes the sheet to fit the column count before writing', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      await api.updateCells(42, [[{ value: 'a' }, { value: 'b' }, { value: 'c' }]]);
      const [, body] = vi.mocked(postJson).mock.calls[0];
      expect((body as any).requests[0]).toEqual({
        updateSheetProperties: {
          properties: { sheetId: 42, gridProperties: { columnCount: 3 } },
          fields: 'gridProperties.columnCount',
        },
      });
    });

    it('uses a minimum column count of 1 when rows is empty', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      await api.updateCells(42, []);
      const [, body] = vi.mocked(postJson).mock.calls[0];
      expect(
        (body as any).requests[0].updateSheetProperties.properties.gridProperties.columnCount,
      ).toBe(1);
    });

    it('posts to the batchUpdate endpoint with the correct start position', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      await api.updateCells(42, []);
      const [, body] = vi.mocked(postJson).mock.calls[0];
      expect((body as any).requests[1].updateCells.start).toEqual({
        sheetId: 42,
        rowIndex: 0,
        columnIndex: 0,
      });
    });

    it('encodes string cell values as stringValue', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      await api.updateCells(1, [[{ value: 'hello' }]]);
      const [, body] = vi.mocked(postJson).mock.calls[0];
      const cell = (body as any).requests[1].updateCells.rows[0].values[0];
      expect(cell.userEnteredValue).toEqual({ stringValue: 'hello' });
    });

    it('encodes numeric cell values as numberValue', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      await api.updateCells(1, [[{ value: 42.5 }]]);
      const [, body] = vi.mocked(postJson).mock.calls[0];
      const cell = (body as any).requests[1].updateCells.rows[0].values[0];
      expect(cell.userEnteredValue).toEqual({ numberValue: 42.5 });
    });

    it('includes userEnteredFormat when a cell carries a format', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      const format = { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } };
      await api.updateCells(1, [[{ value: 45292, format }]]);
      const [, body] = vi.mocked(postJson).mock.calls[0];
      const cell = (body as any).requests[1].updateCells.rows[0].values[0];
      expect(cell.userEnteredFormat).toEqual(format);
    });

    it('omits userEnteredFormat when a cell has no format', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      await api.updateCells(1, [[{ value: 'text' }]]);
      const [, body] = vi.mocked(postJson).mock.calls[0];
      const cell = (body as any).requests[1].updateCells.rows[0].values[0];
      expect(cell).not.toHaveProperty('userEnteredFormat');
    });
  });

  describe('formatCells', () => {
    it('posts repeatCell requests for each range/format pair', async () => {
      vi.mocked(postJson).mockResolvedValue({});
      const range = { sheetId: 1, startColumnIndex: 0, endColumnIndex: 2 };
      const format = { numberFormat: { type: 'CURRENCY', pattern: '€#,##0.00' } };
      await api.formatCells([{ range, format }]);
      expect(postJson).toHaveBeenCalledWith(
        `${API}/sid:batchUpdate`,
        {
          requests: [
            {
              repeatCell: {
                range,
                cell: { userEnteredFormat: format },
                fields: 'userEnteredFormat.numberFormat',
              },
            },
          ],
        },
        { bearerToken: 'my-token' },
      );
    });
  });
});
