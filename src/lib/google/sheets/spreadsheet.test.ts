import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Spreadsheet } from './spreadsheet.ts';
import { createSpreadsheet } from './spreadsheets_api.ts';

// Mutable references populated in each test before `new DriveApi()`/`new SpreadsheetsApi()` runs.
// The factory functions close over these variables and return their current value, which is the
// standard JS constructor-override pattern: if a constructor returns an object, `new` yields it.
let mockDriveInstance: { findSpreadsheetId: ReturnType<typeof vi.fn> };
let mockApiInstance: {
  getSheets?: ReturnType<typeof vi.fn>;
  addSheets?: ReturnType<typeof vi.fn>;
  batchClearValues?: ReturnType<typeof vi.fn>;
};

vi.mock('./drive_api.ts', () => ({
  DriveApi: function DriveApi(this: any) {
    return mockDriveInstance;
  },
}));

vi.mock('./spreadsheets_api.ts', () => ({
  SpreadsheetsApi: function SpreadsheetsApi(this: any) {
    return mockApiInstance;
  },
  createSpreadsheet: vi.fn(),
}));

describe('Spreadsheet', () => {
  describe('getSpreadsheet', () => {
    it('returns null when no spreadsheet is found in Drive', async () => {
      mockDriveInstance = { findSpreadsheetId: vi.fn().mockResolvedValue(null) };
      expect(await Spreadsheet.getSpreadsheet('token', 'missing')).toBeNull();
    });

    it('returns a Spreadsheet populated with the loaded sheets when found', async () => {
      mockDriveInstance = { findSpreadsheetId: vi.fn().mockResolvedValue('spreadsheet-id') };
      mockApiInstance = {
        getSheets: vi.fn().mockResolvedValue([
          { sheetId: 1, title: 'Data' },
          { sheetId: 2, title: 'Assets' },
        ]),
      };

      const spreadsheet = await Spreadsheet.getSpreadsheet('token', 'gilito');
      expect(spreadsheet?.getSheet('Data')?.title).toBe('Data');
      expect(spreadsheet?.getSheet('Assets')?.title).toBe('Assets');
    });
  });

  describe('createNewSpreadsheet', () => {
    it('delegates to createSpreadsheet with the provided token, name, and sheet titles', async () => {
      vi.mocked(createSpreadsheet).mockResolvedValue({ id: 'new-id', sheets: [] });
      mockApiInstance = {};
      await Spreadsheet.createNewSpreadsheet('token', 'gilito', ['Data', 'Assets']);
      expect(createSpreadsheet).toHaveBeenCalledWith('token', 'gilito', ['Data', 'Assets']);
    });

    it('returns a Spreadsheet populated with the created sheets', async () => {
      vi.mocked(createSpreadsheet).mockResolvedValue({
        id: 'new-id',
        sheets: [
          { sheetId: 10, title: 'Data' },
          { sheetId: 11, title: 'Assets' },
        ],
      });
      mockApiInstance = {};

      const spreadsheet = await Spreadsheet.createNewSpreadsheet('token', 'gilito', [
        'Data',
        'Assets',
      ]);
      expect(spreadsheet.getSheet('Data')?.title).toBe('Data');
      expect(spreadsheet.getSheet('Assets')?.title).toBe('Assets');
    });
  });

  // For instance method tests we obtain a real Spreadsheet via createNewSpreadsheet.
  describe('instance methods', () => {
    let spreadsheet: Spreadsheet;

    beforeEach(async () => {
      mockApiInstance = {
        addSheets: vi.fn().mockResolvedValue([{ sheetId: 99, title: 'NewSheet' }]),
        batchClearValues: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(createSpreadsheet).mockResolvedValue({
        id: 'sid',
        sheets: [
          { sheetId: 1, title: 'Data' },
          { sheetId: 2, title: 'Assets' },
        ],
      });
      spreadsheet = await Spreadsheet.createNewSpreadsheet('token', 'gilito', ['Data', 'Assets']);
    });

    describe('getSheets', () => {
      it('returns all sheets', () => {
        expect(spreadsheet.getSheets().map((s) => s.title)).toEqual(['Data', 'Assets']);
      });
    });

    describe('getSheet', () => {
      it('returns the sheet matching the given title', () => {
        expect(spreadsheet.getSheet('Assets')?.title).toBe('Assets');
      });

      it('returns undefined for an unknown title', () => {
        expect(spreadsheet.getSheet('Unknown')).toBeUndefined();
      });
    });

    describe('addSheets', () => {
      it('calls api.addSheets with the given titles and returns Sheet objects', async () => {
        const added = await spreadsheet.addSheets(['NewSheet']);
        expect(mockApiInstance.addSheets).toHaveBeenCalledWith(['NewSheet']);
        expect(added).toHaveLength(1);
        expect(added[0].title).toBe('NewSheet');
      });

      it('makes the newly added sheets accessible via getSheet', async () => {
        await spreadsheet.addSheets(['NewSheet']);
        expect(spreadsheet.getSheet('NewSheet')?.title).toBe('NewSheet');
      });
    });
  });
});
