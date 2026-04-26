import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleSheetsWealthRepository } from './google_sheets_wealth_repository.ts';
import { WealthDataSpreadsheet } from './wealth_data_spreadsheet.ts';
import { Money, Currencies } from 'ts-money';
import { findCategoryById } from '../assets/asset_category.ts';
import { Currency } from '../fx/currency.ts';

vi.mock('./wealth_data_spreadsheet.ts', () => ({
  WealthDataSpreadsheet: {
    getOrCreate: vi.fn(),
  },
}));

function makeMockDataSpreadsheet() {
  return {
    getBalanceSheets: vi.fn().mockReturnValue([]),
    addBalanceSheet: vi.fn(),
    updateBalanceSheet: vi.fn(),
    getIncomeSheets: vi.fn().mockReturnValue([]),
    addIncomeSheet: vi.fn(),
    updateIncomeSheet: vi.fn(),
  };
}

const cashAsset = {
  id: 'cash',
  name: 'Cash',
  category: findCategoryById('defensive.cash.savings'),
  currency: Currency.EUR,
};
const salarySource = { id: 'salary', name: 'Salary', currency: Currency.EUR };

function makeBalanceSheet(year: number) {
  return {
    date: new Date(Date.UTC(year, 0, 1)),
    snapshots: [{ asset: cashAsset, value: new Money(100000, Currencies.EUR) }],
  };
}

function makeIncomeSheet(year: number) {
  return {
    date: new Date(Date.UTC(year, 0, 1)),
    entries: [{ source: salarySource, amount: new Money(500000, Currencies.EUR) }],
    taxPaid: new Money(0, Currencies.EUR),
  };
}

describe('GoogleSheetsWealthRepository', () => {
  let mockDataSpreadsheet: ReturnType<typeof makeMockDataSpreadsheet>;

  beforeEach(() => {
    mockDataSpreadsheet = makeMockDataSpreadsheet();
    vi.mocked(WealthDataSpreadsheet.getOrCreate).mockResolvedValue(
      mockDataSpreadsheet as unknown as WealthDataSpreadsheet,
    );
  });

  describe('create', () => {
    it('delegates to WealthDataSpreadsheet.getOrCreate with the provided token', async () => {
      await GoogleSheetsWealthRepository.create('my-token');
      expect(WealthDataSpreadsheet.getOrCreate).toHaveBeenCalledWith('my-token');
    });
  });

  describe('getAllBalanceSheets', () => {
    it('returns all balance sheets from the spreadsheet', async () => {
      const sheets = [makeBalanceSheet(2023), makeBalanceSheet(2024)];
      mockDataSpreadsheet.getBalanceSheets.mockReturnValue(sheets);
      const repo = await GoogleSheetsWealthRepository.create('token');
      expect(repo.getAllBalanceSheets()).toBe(sheets);
    });

    it('returns empty array when spreadsheet has no data', async () => {
      const repo = await GoogleSheetsWealthRepository.create('token');
      expect(repo.getAllBalanceSheets()).toEqual([]);
    });
  });

  describe('getLatestBalanceSheet', () => {
    it('returns the last balance sheet', async () => {
      const sheets = [makeBalanceSheet(2022), makeBalanceSheet(2023), makeBalanceSheet(2024)];
      mockDataSpreadsheet.getBalanceSheets.mockReturnValue(sheets);
      const repo = await GoogleSheetsWealthRepository.create('token');
      expect(repo.getLatestBalanceSheet()).toBe(sheets[2]);
    });

    it('returns undefined when there are no balance sheets', async () => {
      const repo = await GoogleSheetsWealthRepository.create('token');
      expect(repo.getLatestBalanceSheet()).toBeUndefined();
    });
  });

  describe('addBalanceSheet', () => {
    it('delegates to the spreadsheet', async () => {
      const repo = await GoogleSheetsWealthRepository.create('token');
      const bs = makeBalanceSheet(2024);
      repo.addBalanceSheet(bs);
      expect(mockDataSpreadsheet.addBalanceSheet).toHaveBeenCalledWith(bs);
    });
  });

  describe('updateBalanceSheet', () => {
    it('delegates to the spreadsheet', async () => {
      const repo = await GoogleSheetsWealthRepository.create('token');
      const bs = makeBalanceSheet(2024);
      repo.updateBalanceSheet(bs);
      expect(mockDataSpreadsheet.updateBalanceSheet).toHaveBeenCalledWith(bs);
    });
  });

  describe('getAllIncomeSheets', () => {
    it('returns all income sheets from the spreadsheet', async () => {
      const sheets = [makeIncomeSheet(2023), makeIncomeSheet(2024)];
      mockDataSpreadsheet.getIncomeSheets.mockReturnValue(sheets);
      const repo = await GoogleSheetsWealthRepository.create('token');
      expect(repo.getAllIncomeSheets()).toBe(sheets);
    });

    it('returns empty array when there are no income sheets', async () => {
      const repo = await GoogleSheetsWealthRepository.create('token');
      expect(repo.getAllIncomeSheets()).toEqual([]);
    });
  });

  describe('getLatestIncomeSheet', () => {
    it('returns the last income sheet', async () => {
      const sheets = [makeIncomeSheet(2022), makeIncomeSheet(2023), makeIncomeSheet(2024)];
      mockDataSpreadsheet.getIncomeSheets.mockReturnValue(sheets);
      const repo = await GoogleSheetsWealthRepository.create('token');
      expect(repo.getLatestIncomeSheet()).toBe(sheets[2]);
    });

    it('returns undefined when there are no income sheets', async () => {
      const repo = await GoogleSheetsWealthRepository.create('token');
      expect(repo.getLatestIncomeSheet()).toBeUndefined();
    });
  });

  describe('addIncomeSheet', () => {
    it('delegates to the spreadsheet', async () => {
      const repo = await GoogleSheetsWealthRepository.create('token');
      const sheet = makeIncomeSheet(2024);
      repo.addIncomeSheet(sheet);
      expect(mockDataSpreadsheet.addIncomeSheet).toHaveBeenCalledWith(sheet);
    });
  });

  describe('updateIncomeSheet', () => {
    it('delegates to the spreadsheet', async () => {
      const repo = await GoogleSheetsWealthRepository.create('token');
      const sheet = makeIncomeSheet(2024);
      repo.updateIncomeSheet(sheet);
      expect(mockDataSpreadsheet.updateIncomeSheet).toHaveBeenCalledWith(sheet);
    });
  });
});
