import { Money, Currencies } from 'ts-money';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { TableColumn, TableRow } from '../components/data_table.ts';

export class IncomeSpreadsheetController {
  private readonly repo: WealthRepository;

  constructor(repo: WealthRepository) {
    this.repo = repo;
  }

  getColumns(): TableColumn[] {
    const seen = new Map<string, string>();
    for (const sheet of this.repo.getAllIncomeSheets()) {
      for (const entry of sheet.entries) {
        if (!seen.has(entry.source.id)) seen.set(entry.source.id, entry.source.name);
      }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }

  getRows(): TableRow[] {
    return this.repo.getAllIncomeSheets().map((sheet) => ({
      date: sheet.date,
      values: new Map(sheet.entries.map((e) => [e.source.id, e.amount])),
    }));
  }

  updateCell(id: string, dateIndex: number, euros: number): void {
    const sheets = this.repo.getAllIncomeSheets();
    const sheet = sheets[dateIndex];
    if (!sheet) return;
    const entries = sheet.entries.map((e) => {
      if (e.source.id !== id) return e;
      return { source: e.source, amount: new Money(Math.round(euros * 100), Currencies.EUR) };
    });
    this.repo.updateIncomeSheet({ date: sheet.date, entries });
  }
}
