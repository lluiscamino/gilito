import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleSheetsWealthRepository } from './google_sheets_wealth_repository.ts';
import { WealthDataSpreadsheet } from './wealth_data_spreadsheet.ts';
import { Money, Currencies } from 'ts-money';
import { AssetCategory } from '../assets/asset_category.ts';

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
  };
}

const cashAsset = { id: 'cash', name: 'Cash', category: AssetCategory.CASH };

function makeBalanceSheet(year: number) {
  return {
    date: new Date(Date.UTC(year, 0, 1)),
    snapshots: [{ asset: cashAsset, value: new Money(100000, Currencies.EUR) }],
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
});
