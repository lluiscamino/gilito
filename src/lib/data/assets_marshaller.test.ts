import { describe, it, expect } from 'vitest';
import { AssetsMarshaller } from './assets_marshaller.ts';
import { AssetCategory } from '../assets/asset_category.ts';
import type { Asset } from '../assets/asset.ts';

describe('AssetsMarshaller', () => {
  const marshaller = new AssetsMarshaller();

  describe('parse', () => {
    it('returns empty array for empty input', () => {
      expect(marshaller.parse([])).toEqual([]);
    });

    it('returns empty array for header-only rows', () => {
      const rows = [[{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }]];
      expect(marshaller.parse(rows)).toEqual([]);
    });

    it('parses a single asset row', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }],
        [{ value: 'a1' }, { value: 'Cash' }, { value: 'CASH' }],
      ];
      expect(marshaller.parse(rows)).toEqual([
        { id: 'a1', name: 'Cash', category: AssetCategory.CASH },
      ]);
    });

    it('parses multiple asset rows preserving order', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }],
        [{ value: 'a1' }, { value: 'Cash' }, { value: 'CASH' }],
        [{ value: 'a2' }, { value: 'ETF' }, { value: 'STOCKS' }],
        [{ value: 'a3' }, { value: 'Flat' }, { value: 'PROPERTY' }],
        [{ value: 'a4' }, { value: 'BTC' }, { value: 'CRYPTO' }],
      ];
      expect(marshaller.parse(rows)).toEqual([
        { id: 'a1', name: 'Cash', category: AssetCategory.CASH },
        { id: 'a2', name: 'ETF', category: AssetCategory.STOCKS },
        { id: 'a3', name: 'Flat', category: AssetCategory.PROPERTY },
        { id: 'a4', name: 'BTC', category: AssetCategory.CRYPTO },
      ]);
    });

    it('skips rows with empty id', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }],
        [{ value: '' }, { value: 'Unnamed' }, { value: 'CASH' }],
        [{ value: 'a1' }, { value: 'Cash' }, { value: 'CASH' }],
      ];
      const result = marshaller.parse(rows);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a1');
    });
  });

  describe('toSheetRows', () => {
    it('returns only header row for empty assets', () => {
      const rows = marshaller.toSheetRows([]);
      expect(rows).toHaveLength(1);
      expect(rows[0].map((c) => c.value)).toEqual(['ID', 'Name', 'Category']);
    });

    it('returns header plus one row per asset', () => {
      const assets: Asset[] = [
        { id: 'a1', name: 'Cash', category: AssetCategory.CASH },
        { id: 'a2', name: 'ETF', category: AssetCategory.STOCKS },
      ];
      const rows = marshaller.toSheetRows(assets);
      expect(rows).toHaveLength(3);
      expect(rows[1].map((c) => c.value)).toEqual(['a1', 'Cash', 'CASH']);
      expect(rows[2].map((c) => c.value)).toEqual(['a2', 'ETF', 'STOCKS']);
    });
  });

  it('round-trips assets through toSheetRows → parse', () => {
    const assets: Asset[] = [
      { id: 'a1', name: 'Cash Account', category: AssetCategory.CASH },
      { id: 'a2', name: 'ETF Portfolio', category: AssetCategory.STOCKS },
      { id: 'a3', name: 'Apartment', category: AssetCategory.PROPERTY },
      { id: 'a4', name: 'Bitcoin', category: AssetCategory.CRYPTO },
    ];
    expect(marshaller.parse(marshaller.toSheetRows(assets))).toEqual(assets);
  });
});
