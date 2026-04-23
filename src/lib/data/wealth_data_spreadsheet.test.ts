import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WealthDataSpreadsheet } from './wealth_data_spreadsheet.ts';
import { Spreadsheet } from '../google/sheets/spreadsheet.ts';
import { Money, Currencies } from 'ts-money';
import { findCategoryById } from '../assets/asset_category.ts';
import type { Asset } from '../assets/asset.ts';
import type { IncomeSource } from '../income/income_source.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

vi.mock('../google/sheets/spreadsheet.ts', () => ({
  Spreadsheet: {
    getSpreadsheet: vi.fn(),
    createNewSpreadsheet: vi.fn(),
  },
}));

function makeMockSpreadsheet() {
  const dataSheet = {
    title: 'AssetSnapshots',
    read: vi.fn().mockResolvedValue(null),
    write: vi.fn().mockResolvedValue(undefined),
  };
  const assetsSheet = {
    title: 'Assets',
    read: vi.fn().mockResolvedValue(null),
    write: vi.fn().mockResolvedValue(undefined),
  };
  const incomeSheet = {
    title: 'Income',
    read: vi.fn().mockResolvedValue(null),
    write: vi.fn().mockResolvedValue(undefined),
  };
  const incomeSourcesSheet = {
    title: 'IncomeSources',
    read: vi.fn().mockResolvedValue(null),
    write: vi.fn().mockResolvedValue(undefined),
  };
  const spreadsheet = {
    getSheet: vi.fn().mockImplementation((title: string) => {
      if (title === 'AssetSnapshots') return dataSheet;
      if (title === 'Assets') return assetsSheet;
      if (title === 'Income') return incomeSheet;
      if (title === 'IncomeSources') return incomeSourcesSheet;
      return undefined;
    }),
    getSheets: vi.fn().mockReturnValue([dataSheet, assetsSheet, incomeSheet, incomeSourcesSheet]),
    addSheets: vi.fn().mockResolvedValue([]),
  };
  return { spreadsheet, dataSheet, assetsSheet, incomeSheet, incomeSourcesSheet };
}

const cashAsset: Asset = {
  id: 'cash',
  name: 'Cash',
  category: findCategoryById('defensive.cash.savings'),
  currency: 'EUR',
};

const salarySource: IncomeSource = { id: 'salary', name: 'Salary', currency: 'EUR' };

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

function makeIncomeSheet(date: Date, amountCents = 500000) {
  return {
    date,
    entries: [{ source: salarySource, amount: new Money(amountCents, Currencies.EUR) }],
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
        'AssetSnapshots',
        'Assets',
        'Income',
        'IncomeSources',
      ]);
    });

    it('parses assets and balance sheets from sheet data', async () => {
      const assetRows: SheetRow[] = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }, { value: 'Currency' }],
        [
          { value: 'cash' },
          { value: 'Cash' },
          { value: 'defensive.cash.savings' },
          { value: 'EUR' },
        ],
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
      expect(sheets[0].snapshots[0].asset.id).toBe('cash');
      expect(sheets[0].snapshots[0].asset.category.id).toBe('defensive.cash.savings');
      expect(sheets[0].snapshots[0].value.amount).toBe(100000);
    });

    it('parses income sources and income sheets from sheet data', async () => {
      const sourceRows: SheetRow[] = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Currency' }],
        [{ value: 'salary' }, { value: 'Salary' }, { value: 'EUR' }],
      ];
      const incomeRows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'salary' }],
        [{ value: toSerial(JAN_2024) }, { value: 5000 }],
      ];
      mocks.incomeSourcesSheet.read.mockResolvedValue(sourceRows);
      mocks.incomeSheet.read.mockResolvedValue(incomeRows);

      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      const sheets = wds.getIncomeSheets();
      expect(sheets).toHaveLength(1);
      expect(sheets[0].entries[0].source.id).toBe('salary');
      expect(sheets[0].entries[0].amount.amount).toBe(500000);
    });

    it('returns empty lists when sheets have no data', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      expect(wds.getBalanceSheets()).toEqual([]);
      expect(wds.getIncomeSheets()).toEqual([]);
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

    it('writes assets and data on persist', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addBalanceSheet(makeBalanceSheet(JAN_2024));

      await vi.waitFor(() => expect(mocks.assetsSheet.write).toHaveBeenCalled());
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

  describe('addIncomeSheet', () => {
    it('appends the income sheet', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addIncomeSheet(makeIncomeSheet(JAN_2024));
      expect(wds.getIncomeSheets()).toHaveLength(1);
    });

    it('keeps income sheets sorted by date regardless of insertion order', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addIncomeSheet(makeIncomeSheet(MAR_2024));
      wds.addIncomeSheet(makeIncomeSheet(JAN_2024));
      wds.addIncomeSheet(makeIncomeSheet(FEB_2024));

      const dates = wds.getIncomeSheets().map((s) => s.date.getTime());
      expect(dates).toEqual([...dates].sort((a, b) => a - b));
    });

    it('clears income sheets and writes sources and data on persist', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addIncomeSheet(makeIncomeSheet(JAN_2024));

      await vi.waitFor(() => expect(mocks.incomeSheet.write).toHaveBeenCalled());
      expect(mocks.incomeSourcesSheet.write).toHaveBeenCalled();
    });
  });

  describe('updateIncomeSheet', () => {
    it('returns false when no income sheet exists for the given date', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      expect(wds.updateIncomeSheet(makeIncomeSheet(JAN_2024))).toBe(false);
    });

    it('updates the income sheet matching by date and returns true', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addIncomeSheet(makeIncomeSheet(JAN_2024, 500000));
      await flushPromises();

      const updated = makeIncomeSheet(JAN_2024, 600000);
      expect(wds.updateIncomeSheet(updated)).toBe(true);
      expect(wds.getIncomeSheets()[0].entries[0].amount.amount).toBe(600000);
    });

    it('triggers persistence after updating', async () => {
      const wds = await WealthDataSpreadsheet.getOrCreate('token');
      wds.addIncomeSheet(makeIncomeSheet(JAN_2024));
      await flushPromises();
      mocks.incomeSheet.write.mockClear();

      wds.updateIncomeSheet(makeIncomeSheet(JAN_2024, 600000));
      await vi.waitFor(() => expect(mocks.incomeSheet.write).toHaveBeenCalled());
    });
  });
});
