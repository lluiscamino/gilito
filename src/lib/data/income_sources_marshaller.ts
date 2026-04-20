import type { IncomeSource } from '../income/income_source.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

export class IncomeSourcesMarshaller {
  parse(rows: SheetRow[]): IncomeSource[] {
    const sources: IncomeSource[] = [];
    for (const row of rows.slice(1)) {
      const [id, name] = row.map((c) => c.value) as string[];
      if (!id) continue;
      sources.push({ id, name });
    }
    return sources;
  }

  toSheetRows(sources: IncomeSource[]): SheetRow[] {
    return [
      ['ID', 'Name'].map((v) => ({ value: v })),
      ...sources.map((s) => [s.id, s.name].map((v) => ({ value: v }))),
    ];
  }
}
