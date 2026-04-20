import type { IncomeEntry } from './income_entry.ts';
import type { IncomeSource } from './income_source.ts';

export interface IncomeSheet {
  readonly date: Date;
  readonly entries: readonly IncomeEntry[];
}

export function collectSources(sheets: IncomeSheet[]): IncomeSource[] {
  const seen = new Set<string>();
  const sources: IncomeSource[] = [];
  for (const sheet of sheets) {
    for (const entry of sheet.entries) {
      if (!seen.has(entry.source.id)) {
        seen.add(entry.source.id);
        sources.push(entry.source);
      }
    }
  }
  return sources;
}
