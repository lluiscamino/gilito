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
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }, { value: 'Currency' }],
      ];
      expect(marshaller.parse(rows)).toEqual([]);
    });

    it('parses a single asset row with currency', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }, { value: 'Currency' }],
        [
          { value: 'a1' },
          { value: 'Savings' },
          { value: 'defensive.cash.savings' },
          { value: 'EUR' },
        ],
      ];
      const result = marshaller.parse(rows);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a1');
      expect(result[0].name).toBe('Savings');
      expect(result[0].category.id).toBe('defensive.cash.savings');
      expect(result[0].currency).toBe('EUR');
    });

    it('skips rows with missing or unknown currency', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }],
        [{ value: 'a1' }, { value: 'Savings' }, { value: 'defensive.cash.savings' }],
      ];
      expect(marshaller.parse(rows)).toHaveLength(0);
    });

    it('parses non-EUR currency', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }, { value: 'Currency' }],
        [
          { value: 'a1' },
          { value: 'US Stocks' },
          { value: 'growth.equities.general' },
          { value: 'USD' },
        ],
      ];
      const result = marshaller.parse(rows);
      expect(result[0].currency).toBe('USD');
    });

    it('parses multiple asset rows preserving order', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }, { value: 'Currency' }],
        [
          { value: 'a1' },
          { value: 'Current' },
          { value: 'defensive.cash.current' },
          { value: 'EUR' },
        ],
        [{ value: 'a2' }, { value: 'ETF' }, { value: 'growth.equities.general' }, { value: 'EUR' }],
        [{ value: 'a3' }, { value: 'Flat' }, { value: 'growth.property' }, { value: 'EUR' }],
        [{ value: 'a4' }, { value: 'BTC' }, { value: 'growth.crypto' }, { value: 'EUR' }],
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
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }, { value: 'Currency' }],
        [
          { value: '' },
          { value: 'Unnamed' },
          { value: 'defensive.cash.savings' },
          { value: 'EUR' },
        ],
        [
          { value: 'a1' },
          { value: 'Savings' },
          { value: 'defensive.cash.savings' },
          { value: 'EUR' },
        ],
      ];
      const result = marshaller.parse(rows);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a1');
    });

    it('skips rows with an unknown category id', () => {
      const rows = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Category' }, { value: 'Currency' }],
        [{ value: 'a1' }, { value: 'Savings' }, { value: 'UNKNOWN' }, { value: 'EUR' }],
        [{ value: 'a2' }, { value: 'Crypto' }, { value: 'growth.crypto' }, { value: 'EUR' }],
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
      expect(rows[0].map((c) => c.value)).toEqual(['ID', 'Name', 'Category', 'Currency']);
    });

    it('serialises category as its id string and includes currency', () => {
      const assets: Asset[] = [
        {
          id: 'a1',
          name: 'Savings',
          category: findCategoryById('defensive.cash.savings'),
          currency: 'EUR',
        },
        {
          id: 'a2',
          name: 'ETF',
          category: findCategoryById('growth.equities.general'),
          currency: 'USD',
        },
      ];
      const rows = marshaller.toSheetRows(assets);
      expect(rows).toHaveLength(3);
      expect(rows[1].map((c) => c.value)).toEqual([
        'a1',
        'Savings',
        'defensive.cash.savings',
        'EUR',
      ]);
      expect(rows[2].map((c) => c.value)).toEqual(['a2', 'ETF', 'growth.equities.general', 'USD']);
    });
  });

  it('round-trips assets through toSheetRows → parse', () => {
    const assets: Asset[] = [
      {
        id: 'a1',
        name: 'Current Account',
        category: findCategoryById('defensive.cash.current'),
        currency: 'EUR',
      },
      {
        id: 'a2',
        name: 'ETF Portfolio',
        category: findCategoryById('growth.equities.general'),
        currency: 'USD',
      },
      {
        id: 'a3',
        name: 'Apartment',
        category: findCategoryById('growth.property'),
        currency: 'EUR',
      },
      { id: 'a4', name: 'Bitcoin', category: findCategoryById('growth.crypto'), currency: 'EUR' },
    ];
    expect(marshaller.parse(marshaller.toSheetRows(assets))).toEqual(assets);
  });
});
