import { describe, it, expect } from 'vitest';
import { IncomeSourcesMarshaller } from './income_sources_marshaller.ts';
import type { IncomeSource } from '../income/income_source.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

const marshaller = new IncomeSourcesMarshaller();

describe('IncomeSourcesMarshaller', () => {
  describe('parse', () => {
    it('parses sources from sheet rows with currency', () => {
      const rows: SheetRow[] = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Currency' }],
        [{ value: 'salary' }, { value: 'Salary' }, { value: 'EUR' }],
        [{ value: 'freelance' }, { value: 'Freelance' }, { value: 'USD' }],
      ];
      const sources = marshaller.parse(rows);
      expect(sources).toHaveLength(2);
      expect(sources[0]).toEqual({ id: 'salary', name: 'Salary', currency: 'EUR' });
      expect(sources[1]).toEqual({ id: 'freelance', name: 'Freelance', currency: 'USD' });
    });

    it('skips rows with missing or unknown currency', () => {
      const rows: SheetRow[] = [
        [{ value: 'ID' }, { value: 'Name' }],
        [{ value: 'salary' }, { value: 'Salary' }],
      ];
      expect(marshaller.parse(rows)).toHaveLength(0);
    });

    it('skips rows with no id', () => {
      const rows: SheetRow[] = [
        [{ value: 'ID' }, { value: 'Name' }, { value: 'Currency' }],
        [{ value: '' }, { value: 'Empty' }, { value: 'EUR' }],
      ];
      expect(marshaller.parse(rows)).toHaveLength(0);
    });

    it('returns empty array for header-only input', () => {
      const rows: SheetRow[] = [[{ value: 'ID' }, { value: 'Name' }, { value: 'Currency' }]];
      expect(marshaller.parse(rows)).toEqual([]);
    });
  });

  describe('toSheetRows', () => {
    it('produces a header row followed by source rows with currency', () => {
      const sources: IncomeSource[] = [
        { id: 'salary', name: 'Salary', currency: 'EUR' },
        { id: 'freelance', name: 'Freelance', currency: 'USD' },
      ];
      const rows = marshaller.toSheetRows(sources);
      expect(rows[0].map((c) => c.value)).toEqual(['ID', 'Name', 'Currency']);
      expect(rows[1].map((c) => c.value)).toEqual(['salary', 'Salary', 'EUR']);
      expect(rows[2].map((c) => c.value)).toEqual(['freelance', 'Freelance', 'USD']);
    });

    it('round-trips through parse and toSheetRows', () => {
      const sources: IncomeSource[] = [{ id: 'salary', name: 'Salary', currency: 'EUR' }];
      expect(marshaller.parse(marshaller.toSheetRows(sources))).toEqual(sources);
    });
  });
});
