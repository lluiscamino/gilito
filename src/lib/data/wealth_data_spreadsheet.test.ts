import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WealthDataSpreadsheet } from './wealth_data_spreadsheet.ts';
import { Spreadsheet } from '../google/sheets/spreadsheet.ts';
import { Money, Currencies } from 'ts-money';
import { AssetCategory } from '../assets/asset_category.ts';
import type { Asset } from '../assets/asset.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

vi.mock('../google/sheets/spreadsheet.ts', () => ({
  Spreadsheet: {
    getSpreadsheet: vi.fn(),
    createNewSpreadsheet: vi.fn(),
  },
}));

function makeMockSpreadsheet() {
  const dataSheet = {
    title: 'Data',
    read: vi.fn().mockResolvedValue(null),
    write: vi.fn().mockResolvedValue(undefined),
  };
  const assetsSheet = {
    title: 'Assets',
    read: vi.fn().mockResolvedValue(null),
    write: vi.fn().mockResolvedValue(undefined),
  };
  const spreadsheet = {
    getSheet: vi.fn().mockImplementation((title: string) => {
      if (title === 'Data') return dataSheet;
      if (title === 'Assets') return assetsSheet;
      return undefined;
    }),
    getSheets: vi.fn().mockReturnValue([dataSheet, assetsSheet]),
    clearSheets: vi.fn().mockResolvedValue(undefined),
    addSheets: vi.fn().mockResolvedValue([]),
  };
  return { spreadsheet, dataSheet, assetsSheet };
}

const cashAsset: Asset = { id: 'cash', name: 'Cash', category: AssetCategory.CASH };

const toSerial = (date: Date) => date.getTime() / 86400000 + 25569;
const JAN_2024 = new Date(Date.UTC(2024, 0, 1));
const FEB_2024 = new Date(Date.UTC(2024, 1, 1));
const MAR_2024 = new Date(Date.UTC(2024, 2, 1));

function makeBalanceSheet(date: Date, amountCents = 100000) {
  return {
    date,
    snapshots: [{ asset: cashAsset, value: new Money(amountCents, Currencies.EUR) }],
  };
}

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe('WealthDataSpreadsheet', () => {
  let mocks: ReturnType<typeof makeMockSpreadsheet>;

  beforeEach(() => {
    mocks = makeMockSpreadsheet();
    vi.mocked(Spreadsheet.getSpreadsheet).mockResolvedValue(
      mocks.spreadsheet as unknown as Spreadsheet,
    );
    vi.mocked(Spreadsheet.createNewSpreadsheet).mockResolvedValue(
      mocks.spreadsheet as unknown as Spreadsheet,
    );
  });

  describe('getOrCreate', () => {
    it('uses the existing spreadsheet when found', async () => {
      await WealthDataSpreadsheet.getOrCreate('token');
      expect(Spreadsheet.getSpreadsheet).toHaveBeenCalledWith('token', 'gilito');
      expect(Spreadsheet.createNewSpreadsheet).not.toHaveBeenCalled();
    });

    it('creates a new spreadsheet when none exists', async () => {
      vi.mocked(Spreadsheet.getSpreadsheet).mockResolvedValue(null);
      await WealthDataSpreadsheet.getOrCreate('token');
      expect(Spreadsheet.createNewSpreadsheet).toHaveBeenCalledWith('token', 'gilito', [
        'Data',
        'Assets',
      ]);
    });

    it('parses assets and balance sheets from sheet data', async () => {
      const assetRows: SheetRow[] = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }],
        [{ value: 'cash' }, { value: 'Cash' }, { value: 'CASH' }],
      ];
      const dataRows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'cash' }],
        [{ value: toSerial(JAN_2024) }, { value: 1000 }],
      ];
      mocks.assetsSheet.read.mockResolvedValue(assetRows);
      mocks.dataSheet.read.mockResolvedValue(dataRows);

      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      const sheets = wds.getBalanceSheets();
      expect(sheets).toHaveLength(1);
      expect(sheets[0].snapshots[0].asset).toEqual({
        id: 'cash',
        name: 'Cash',
        category: AssetCategory.CASH,
      });
      expect(sheets[0].snapshots[0].value.amount).toBe(100000);
    });

    it('returns an empty balance sheet list when sheets have no data', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      expect(wds.getBalanceSheets()).toEqual([]);
    });
  });

  describe('addBalanceSheet', () => {
    it('appends the balance sheet', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addBalanceSheet(makeBalanceSheet(JAN_2024));
      expect(wds.getBalanceSheets()).toHaveLength(1);
    });

    it('keeps balance sheets sorted by date regardless of insertion order', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addBalanceSheet(makeBalanceSheet(MAR_2024));
      wds.addBalanceSheet(makeBalanceSheet(JAN_2024));
      wds.addBalanceSheet(makeBalanceSheet(FEB_2024));

      const dates = wds.getBalanceSheets().map((s) => s.date.getTime());
      expect(dates).toEqual([...dates].sort((a, b) => a - b));
    });

    it('clears sheets and writes assets and data on persist', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addBalanceSheet(makeBalanceSheet(JAN_2024));

      await vi.waitFor(() => expect(mocks.spreadsheet.clearSheets).toHaveBeenCalled());
      expect(mocks.assetsSheet.write).toHaveBeenCalled();
      expect(mocks.dataSheet.write).toHaveBeenCalled();
    });

    it('writes the correct asset ids to the data sheet', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addBalanceSheet(makeBalanceSheet(JAN_2024));

      await vi.waitFor(() => expect(mocks.dataSheet.write).toHaveBeenCalled());
      const [[dataRows]] = mocks.dataSheet.write.mock.calls;
      expect((dataRows[0] as SheetRow).map((c: { value: unknown }) => c.value)).toContain('cash');
    });
  });

  describe('updateBalanceSheet', () => {
    it('returns false when no balance sheet exists for the given date', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      expect(wds.updateBalanceSheet(makeBalanceSheet(JAN_2024))).toBe(false);
    });

    it('updates the balance sheet matching by date and returns true', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addBalanceSheet(makeBalanceSheet(JAN_2024, 100000));
      await flushPromises();

      const updated = makeBalanceSheet(JAN_2024, 200000);
      expect(wds.updateBalanceSheet(updated)).toBe(true);
      expect(wds.getBalanceSheets()[0].snapshots[0].value.amount).toBe(200000);
    });

    it('does not modify other balance sheets when updating', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addBalanceSheet(makeBalanceSheet(JAN_2024, 100000));
      wds.addBalanceSheet(makeBalanceSheet(FEB_2024, 200000));
      await flushPromises();

      wds.updateBalanceSheet(makeBalanceSheet(JAN_2024, 999999));
      expect(wds.getBalanceSheets()[1].snapshots[0].value.amount).toBe(200000);
    });

    it('triggers persistence after updating', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addBalanceSheet(makeBalanceSheet(JAN_2024));
      await flushPromises();
      mocks.dataSheet.write.mockClear();

      wds.updateBalanceSheet(makeBalanceSheet(JAN_2024, 200000));
      await vi.waitFor(() => expect(mocks.dataSheet.write).toHaveBeenCalled());
    });
  });
});
