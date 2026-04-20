import type { IncomeSource } from '../income/income_source.ts';
import { isCurrency } from '../fx/currency.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

export class IncomeSourcesMarshaller {
  parse(rows: SheetRow[]): IncomeSource[] {
    const sources: IncomeSource[] = [];
    for (const row of rows.slice(1)) {
      const [id, name, currency] = row.map((c) => c.value) as string[];
      if (!id) continue;
      if (!isCurrency(currency)) continue;
      sources.push({ id, name, currency });
    }
    return sources;
  }

  toSheetRows(sources: IncomeSource[]): SheetRow[] {
    return [
      ['ID', 'Name', 'Currency'].map((v) => ({ value: v })),
      ...sources.map((s) => [s.id, s.name, s.currency].map((v) => ({ value: v }))),
    ];
  }
}
