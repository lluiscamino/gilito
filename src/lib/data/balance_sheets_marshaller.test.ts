import { describe, it, expect } from 'vitest';
import { Money, Currencies } from 'ts-money';
import { BalanceSheetsMarshaller } from './balance_sheets_marshaller.ts';
import { findCategoryById } from '../assets/asset_category.ts';
import type { Asset } from '../assets/asset.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

const EUR = Currencies.EUR;
const toSerial = (date: Date) => date.getTime() / 86400000 + 25569;
const CASH_SAVINGS = findCategoryById('defensive.cash.savings');
const EQUITIES_GENERAL = findCategoryById('growth.equities.general');

describe('BalanceSheetsMarshaller', () => {
  const marshaller = new BalanceSheetsMarshaller();

  describe('parse', () => {
    it('returns empty array for empty input', () => {
      expect(marshaller.parse([], [])).toEqual([]);
    });

    it('returns empty array when only header row is present', () => {
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const rows: SheetRow[] = [[{ value: 'Date' }, { value: 'cash' }]];
      expect(marshaller.parse(rows, [asset])).toEqual([]);
    });

    it('parses date serial into a Date', () => {
      const date = new Date(Date.UTC(2024, 0, 1));
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'cash' }],
        [{ value: toSerial(date) }, { value: 100 }],
      ];
      const result = marshaller.parse(rows, [asset]);
      expect(result[0].date.getTime()).toBe(date.getTime());
    });

    it('parses euro amount into cents', () => {
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'cash' }],
        [{ value: toSerial(new Date(Date.UTC(2024, 0, 1))) }, { value: 1500.5 }],
      ];
      const result = marshaller.parse(rows, [asset]);
      expect(result[0].snapshots[0].value.amount).toBe(150050);
      expect(result[0].snapshots[0].value.currency).toBe('EUR'); // asset currency
    });

    it('parses multiple assets per row', () => {
      const cashAsset: Asset = {
        id: 'cash',
        name: 'Cash',
        category: CASH_SAVINGS,
        currency: 'EUR',
      };
      const stocksAsset: Asset = {
        id: 'stocks',
        name: 'ETF',
        category: EQUITIES_GENERAL,
        currency: 'EUR',
      };
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'cash' }, { value: 'stocks' }],
        [{ value: toSerial(new Date(Date.UTC(2024, 0, 1))) }, { value: 500 }, { value: 1000 }],
      ];
      const result = marshaller.parse(rows, [cashAsset, stocksAsset]);
      expect(result[0].snapshots).toHaveLength(2);
      expect(result[0].snapshots[0].asset.id).toBe('cash');
      expect(result[0].snapshots[1].asset.id).toBe('stocks');
    });

    it('parses multiple balance sheet rows', () => {
      const jan = new Date(Date.UTC(2024, 0, 1));
      const feb = new Date(Date.UTC(2024, 1, 1));
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'cash' }],
        [{ value: toSerial(jan) }, { value: 1000 }],
        [{ value: toSerial(feb) }, { value: 1100 }],
      ];
      const result = marshaller.parse(rows, [asset]);
      expect(result).toHaveLength(2);
      expect(result[0].date.getTime()).toBe(jan.getTime());
      expect(result[1].date.getTime()).toBe(feb.getTime());
    });

    it('skips snapshots for unknown asset ids', () => {
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'unknown' }, { value: 'cash' }],
        [{ value: toSerial(new Date(Date.UTC(2024, 0, 1))) }, { value: 100 }, { value: 200 }],
      ];
      const result = marshaller.parse(rows, [asset]);
      expect(result[0].snapshots).toHaveLength(1);
      expect(result[0].snapshots[0].asset.id).toBe('cash');
    });

    it('skips zero-value snapshots', () => {
      const cashAsset: Asset = {
        id: 'cash',
        name: 'Cash',
        category: CASH_SAVINGS,
        currency: 'EUR',
      };
      const stocksAsset: Asset = {
        id: 'stocks',
        name: 'ETF',
        category: EQUITIES_GENERAL,
        currency: 'EUR',
      };
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'cash' }, { value: 'stocks' }],
        [{ value: toSerial(new Date(Date.UTC(2024, 0, 1))) }, { value: 0 }, { value: 500 }],
      ];
      const result = marshaller.parse(rows, [cashAsset, stocksAsset]);
      expect(result[0].snapshots).toHaveLength(1);
      expect(result[0].snapshots[0].asset.id).toBe('stocks');
    });

    it('treats missing column values as zero and skips them', () => {
      const cashAsset: Asset = {
        id: 'cash',
        name: 'Cash',
        category: CASH_SAVINGS,
        currency: 'EUR',
      };
      const stocksAsset: Asset = {
        id: 'stocks',
        name: 'ETF',
        category: EQUITIES_GENERAL,
        currency: 'EUR',
      };
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'cash' }, { value: 'stocks' }],
        [{ value: toSerial(new Date(Date.UTC(2024, 0, 1))) }, { value: 100 }], // stocks column missing
      ];
      const result = marshaller.parse(rows, [cashAsset, stocksAsset]);
      expect(result[0].snapshots).toHaveLength(1);
      expect(result[0].snapshots[0].asset.id).toBe('cash');
    });
  });

  describe('toSheetRows', () => {
    it('returns header row with asset ids', () => {
      const rows = marshaller.toSheetRows([], ['cash', 'stocks']);
      expect(rows).toHaveLength(1);
      expect(rows[0].map((c) => c.value)).toEqual(['Date', 'cash', 'stocks']);
    });

    it('encodes date as sheets serial number with DATE format', () => {
      const date = new Date(Date.UTC(2024, 0, 1));
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const bs = { date, snapshots: [{ asset, value: new Money(100000, EUR) }] };
      const rows = marshaller.toSheetRows([bs], ['cash']);
      expect(rows[1][0].value).toBe(toSerial(date));
      expect(rows[1][0].format?.numberFormat?.type).toBe('DATE');
    });

    it('encodes asset value as euros with CURRENCY format', () => {
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const bs = {
        date: new Date(Date.UTC(2024, 0, 1)),
        snapshots: [{ asset, value: new Money(150050, EUR) }],
      };
      const rows = marshaller.toSheetRows([bs], ['cash']);
      expect(rows[1][1].value).toBeCloseTo(1500.5);
      expect(rows[1][1].format?.numberFormat?.type).toBe('CURRENCY');
    });

    it('fills 0 for assets absent from a balance sheet', () => {
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const bs = {
        date: new Date(Date.UTC(2024, 0, 1)),
        snapshots: [{ asset, value: new Money(100000, EUR) }],
      };
      const rows = marshaller.toSheetRows([bs], ['cash', 'stocks']);
      expect(rows[1][2].value).toBe(0);
    });

    it('returns one data row per balance sheet', () => {
      const asset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
      const bs1 = {
        date: new Date(Date.UTC(2024, 0, 1)),
        snapshots: [{ asset, value: new Money(100000, EUR) }],
      };
      const bs2 = {
        date: new Date(Date.UTC(2024, 1, 1)),
        snapshots: [{ asset, value: new Money(110000, EUR) }],
      };
      const rows = marshaller.toSheetRows([bs1, bs2], ['cash']);
      expect(rows).toHaveLength(3); // header + 2 data rows
    });
  });

  it('round-trips balance sheets through toSheetRows → parse', () => {
    const jan = new Date(Date.UTC(2024, 0, 1));
    const feb = new Date(Date.UTC(2024, 1, 1));
    const cashAsset: Asset = { id: 'cash', name: 'Cash', category: CASH_SAVINGS, currency: 'EUR' };
    const stocksAsset: Asset = {
      id: 'stocks',
      name: 'ETF',
      category: EQUITIES_GENERAL,
      currency: 'EUR',
    };
    const bs1 = {
      date: jan,
      snapshots: [
        { asset: cashAsset, value: new Money(100000, EUR) },
        { asset: stocksAsset, value: new Money(500050, EUR) },
      ],
    };
    const bs2 = {
      date: feb,
      snapshots: [{ asset: cashAsset, value: new Money(110000, EUR) }],
    };
    const rows = marshaller.toSheetRows([bs1, bs2], ['cash', 'stocks']);
    const result = marshaller.parse(rows, [cashAsset, stocksAsset]);

    expect(result).toHaveLength(2);
    expect(result[0].date.getTime()).toBe(jan.getTime());
    expect(result[0].snapshots).toHaveLength(2);
    expect(result[0].snapshots[0].value.amount).toBe(100000);
    expect(result[0].snapshots[1].value.amount).toBe(500050);
    expect(result[1].date.getTime()).toBe(feb.getTime());
    expect(result[1].snapshots).toHaveLength(1);
    expect(result[1].snapshots[0].value.amount).toBe(110000);
  });
});
