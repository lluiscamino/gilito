import { describe, it, expect } from 'vitest';
import { AssetsMarshaller } from './assets_marshaller.ts';
import { findCategoryById } from '../assets/asset_category.ts';
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
        [{ value: 'a1' }, { value: 'Savings' }, { value: 'defensive.cash.savings' }],
      ];
      const result = marshaller.parse(rows);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a1');
      expect(result[0].name).toBe('Savings');
      expect(result[0].category.id).toBe('defensive.cash.savings');
    });

    it('parses multiple asset rows preserving order', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }],
        [{ value: 'a1' }, { value: 'Current' }, { value: 'defensive.cash.current' }],
        [{ value: 'a2' }, { value: 'ETF' }, { value: 'growth.equities.general' }],
        [{ value: 'a3' }, { value: 'Flat' }, { value: 'growth.property' }],
        [{ value: 'a4' }, { value: 'BTC' }, { value: 'growth.crypto' }],
      ];
      const result = marshaller.parse(rows);
      expect(result.map((a) => a.category.id)).toEqual([
        'defensive.cash.current',
        'growth.equities.general',
        'growth.property',
        'growth.crypto',
      ]);
    });

    it('skips rows with empty id', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }],
        [{ value: '' }, { value: 'Unnamed' }, { value: 'defensive.cash.savings' }],
        [{ value: 'a1' }, { value: 'Savings' }, { value: 'defensive.cash.savings' }],
      ];
      const result = marshaller.parse(rows);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a1');
    });

    it('skips rows with an unknown category id', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }],
        [{ value: 'a1' }, { value: 'Savings' }, { value: 'UNKNOWN' }],
        [{ value: 'a2' }, { value: 'Crypto' }, { value: 'growth.crypto' }],
      ];
      const result = marshaller.parse(rows);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a2');
    });
  });

  describe('toSheetRows', () => {
    it('returns only header row for empty assets', () => {
      const rows = marshaller.toSheetRows([]);
      expect(rows).toHaveLength(1);
      expect(rows[0].map((c) => c.value)).toEqual(['ID', 'Name', 'Category']);
    });

    it('serialises category as its id string', () => {
      const assets: Asset[] = [
        { id: 'a1', name: 'Savings', category: findCategoryById('defensive.cash.savings') },
        { id: 'a2', name: 'ETF', category: findCategoryById('growth.equities.general') },
      ];
      const rows = marshaller.toSheetRows(assets);
      expect(rows).toHaveLength(3);
      expect(rows[1].map((c) => c.value)).toEqual(['a1', 'Savings', 'defensive.cash.savings']);
      expect(rows[2].map((c) => c.value)).toEqual(['a2', 'ETF', 'growth.equities.general']);
    });
  });

  it('round-trips assets through toSheetRows → parse', () => {
    const assets: Asset[] = [
      { id: 'a1', name: 'Current Account', category: findCategoryById('defensive.cash.current') },
      { id: 'a2', name: 'ETF Portfolio', category: findCategoryById('growth.equities.general') },
      { id: 'a3', name: 'Apartment', category: findCategoryById('growth.property') },
      { id: 'a4', name: 'Bitcoin', category: findCategoryById('growth.crypto') },
    ];
    expect(marshaller.parse(marshaller.toSheetRows(assets))).toEqual(assets);
  });
});
