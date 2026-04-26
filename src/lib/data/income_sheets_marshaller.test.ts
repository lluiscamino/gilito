import { describe, it, expect } from 'vitest';
import { Money } from 'ts-money';
import { IncomeSheetsMarshaller } from './income_sheets_marshaller.ts';
import type { IncomeSource } from '../income/income_source.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

const marshaller = new IncomeSheetsMarshaller();

const toSerial = (date: Date) => date.getTime() / 86400000 + 25569;
const JAN_2024 = new Date(Date.UTC(2024, 0, 1));
const FEB_2024 = new Date(Date.UTC(2024, 1, 1));

const salary: IncomeSource = { id: 'salary', name: 'Salary', currency: 'EUR' };
const freelance: IncomeSource = { id: 'freelance', name: 'Freelance', currency: 'EUR' };
const ZERO = new Money(0, 'EUR');

describe('IncomeSheetsMarshaller', () => {
  describe('parse', () => {
    it('parses income sheets from rows', () => {
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'salary' }],
        [{ value: toSerial(JAN_2024) }, { value: 5000 }],
      ];
      const sheets = marshaller.parse(rows, [salary]);
      expect(sheets).toHaveLength(1);
      expect(sheets[0].entries[0].source.id).toBe('salary');
      expect(sheets[0].entries[0].amount.amount).toBe(500000);
    });

    it('skips zero-value entries', () => {
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'salary' }, { value: 'freelance' }],
        [{ value: toSerial(JAN_2024) }, { value: 5000 }, { value: 0 }],
      ];
      const sheets = marshaller.parse(rows, [salary, freelance]);
      expect(sheets[0].entries).toHaveLength(1);
    });

    it('skips columns whose source id is not in the provided sources', () => {
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'unknown' }],
        [{ value: toSerial(JAN_2024) }, { value: 1000 }],
      ];
      expect(marshaller.parse(rows, [salary])[0].entries).toHaveLength(0);
    });

    it('returns empty array when there are fewer than 2 rows', () => {
      expect(marshaller.parse([], [salary])).toEqual([]);
      expect(marshaller.parse([[{ value: 'Date' }]], [salary])).toEqual([]);
    });

    it('parses taxPaid from TaxPaid column', () => {
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'salary' }, { value: 'TaxPaid' }],
        [{ value: toSerial(JAN_2024) }, { value: 5000 }, { value: 1500 }],
      ];
      const sheets = marshaller.parse(rows, [salary]);
      expect(sheets[0].taxPaid.amount).toBe(150000);
    });

    it('sets taxPaid to zero when TaxPaid column is absent', () => {
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'salary' }],
        [{ value: toSerial(JAN_2024) }, { value: 5000 }],
      ];
      const sheets = marshaller.parse(rows, [salary]);
      expect(sheets[0].taxPaid.amount).toBe(0);
    });

    it('sets taxPaid to zero when TaxPaid column is zero', () => {
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'salary' }, { value: 'TaxPaid' }],
        [{ value: toSerial(JAN_2024) }, { value: 5000 }, { value: 0 }],
      ];
      const sheets = marshaller.parse(rows, [salary]);
      expect(sheets[0].taxPaid.amount).toBe(0);
    });

    it('does not include TaxPaid header in source ids', () => {
      const rows: SheetRow[] = [
        [{ value: 'Date' }, { value: 'salary' }, { value: 'TaxPaid' }],
        [{ value: toSerial(JAN_2024) }, { value: 5000 }, { value: 1500 }],
      ];
      const sheets = marshaller.parse(rows, [salary]);
      expect(sheets[0].entries).toHaveLength(1);
      expect(sheets[0].entries[0].source.id).toBe('salary');
    });
  });

  describe('toSheetRows', () => {
    it('produces a header row and a data row per sheet', () => {
      const sheets = [
        {
          date: JAN_2024,
          entries: [{ source: salary, amount: new Money(500000, 'EUR') }],
          taxPaid: ZERO,
        },
      ];
      const rows = marshaller.toSheetRows(sheets, ['salary']);
      expect(rows).toHaveLength(2);
      expect(rows[0][1].value).toBe('salary');
      expect((rows[1][1] as { value: number }).value).toBe(5000);
    });

    it('appends TaxPaid column to header', () => {
      const sheets = [{ date: JAN_2024, entries: [], taxPaid: ZERO }];
      const rows = marshaller.toSheetRows(sheets, ['salary']);
      expect(rows[0].at(-1)?.value).toBe('TaxPaid');
    });

    it('writes taxPaid value in TaxPaid column', () => {
      const sheets = [{ date: JAN_2024, entries: [], taxPaid: new Money(150000, 'EUR') }];
      const rows = marshaller.toSheetRows(sheets, ['salary']);
      expect((rows[1].at(-1) as { value: number }).value).toBe(1500);
    });

    it('writes 0 for sources absent from an entry', () => {
      const sheets = [{ date: JAN_2024, entries: [], taxPaid: ZERO }];
      const rows = marshaller.toSheetRows(sheets, ['salary']);
      expect((rows[1][1] as { value: number }).value).toBe(0);
    });

    it('round-trips through parse and toSheetRows', () => {
      const sheets = [
        {
          date: JAN_2024,
          entries: [{ source: salary, amount: new Money(500000, 'EUR') }],
          taxPaid: new Money(150000, 'EUR'),
        },
        {
          date: FEB_2024,
          entries: [
            { source: salary, amount: new Money(500000, 'EUR') },
            { source: freelance, amount: new Money(120000, 'EUR') },
          ],
          taxPaid: new Money(200000, 'EUR'),
        },
      ];
      const sourceIds = [salary.id, freelance.id];
      const parsed = marshaller.parse(marshaller.toSheetRows(sheets, sourceIds), [
        salary,
        freelance,
      ]);
      expect(parsed).toHaveLength(2);
      expect(parsed[1].entries).toHaveLength(2);
      expect(parsed[1].entries[1].amount.amount).toBe(120000);
      expect(parsed[0].taxPaid.amount).toBe(150000);
      expect(parsed[1].taxPaid.amount).toBe(200000);
    });
  });
});
