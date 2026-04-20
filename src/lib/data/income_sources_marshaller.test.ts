import { describe, it, expect } from 'vitest';
import { IncomeSourcesMarshaller } from './income_sources_marshaller.ts';
import type { IncomeSource } from '../income/income_source.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

const marshaller = new IncomeSourcesMarshaller();

describe('IncomeSourcesMarshaller', () => {
  describe('parse', () => {
    it('parses sources from sheet rows', () => {
      const rows: SheetRow[] = [
        [{ value: 'ID' }, { value: 'Name' }],
        [{ value: 'salary' }, { value: 'Salary' }],
        [{ value: 'freelance' }, { value: 'Freelance' }],
      ];
      const sources = marshaller.parse(rows);
      expect(sources).toHaveLength(2);
      expect(sources[0]).toEqual({ id: 'salary', name: 'Salary' });
      expect(sources[1]).toEqual({ id: 'freelance', name: 'Freelance' });
    });

    it('skips rows with no id', () => {
      const rows: SheetRow[] = [
        [{ value: 'ID' }, { value: 'Name' }],
        [{ value: '' }, { value: 'Empty' }],
      ];
      expect(marshaller.parse(rows)).toHaveLength(0);
    });

    it('returns empty array for header-only input', () => {
      const rows: SheetRow[] = [[{ value: 'ID' }, { value: 'Name' }]];
      expect(marshaller.parse(rows)).toEqual([]);
    });
  });

  describe('toSheetRows', () => {
    it('produces a header row followed by source rows', () => {
      const sources: IncomeSource[] = [
        { id: 'salary', name: 'Salary' },
        { id: 'freelance', name: 'Freelance' },
      ];
      const rows = marshaller.toSheetRows(sources);
      expect(rows[0].map((c) => c.value)).toEqual(['ID', 'Name']);
      expect(rows[1].map((c) => c.value)).toEqual(['salary', 'Salary']);
      expect(rows[2].map((c) => c.value)).toEqual(['freelance', 'Freelance']);
    });

    it('round-trips through parse and toSheetRows', () => {
      const sources: IncomeSource[] = [{ id: 'salary', name: 'Salary' }];
      expect(marshaller.parse(marshaller.toSheetRows(sources))).toEqual(sources);
    });
  });
});
