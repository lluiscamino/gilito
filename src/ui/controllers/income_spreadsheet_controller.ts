import { Money } from 'ts-money';
import type { Currency } from '../../lib/fx/currency.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import { sumInDisplayCurrency } from '../../lib/fx/money.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { TableColumn, TableRow } from '../components/data_table.ts';

export class IncomeSpreadsheetController {
  private readonly repo: WealthRepository;
  private readonly converter: CurrencyConverter;

  constructor(repo: WealthRepository, converter: CurrencyConverter) {
    this.repo = repo;
    this.converter = converter;
  }

  getColumns(): TableColumn[] {
    const seen = new Map<string, { name: string; currency: Currency }>();
    for (const sheet of this.repo.getAllIncomeSheets()) {
      for (const entry of sheet.entries) {
        if (!seen.has(entry.source.id)) {
          seen.set(entry.source.id, { name: entry.source.name, currency: entry.source.currency });
        }
      }
    }
    return [...seen.entries()].map(([id, { name, currency }]) => ({ id, name, currency }));
  }

  getRows(): TableRow[] {
    return this.repo.getAllIncomeSheets().map((sheet) => {
      const values = new Map(sheet.entries.map((e) => [e.source.id, e.amount]));
      const total = sumInDisplayCurrency(
        sheet.entries.map((e) => e.amount),
        this.converter,
      );
      return { date: sheet.date, values, total };
    });
  }

  updateCell(id: string, dateIndex: number, amount: number): void {
    const sheets = this.repo.getAllIncomeSheets();
    const sheet = sheets[dateIndex];
    if (!sheet) return;
    const entries = sheet.entries.map((e) => {
      if (e.source.id !== id) return e;
      return { source: e.source, amount: new Money(Math.round(amount * 100), e.source.currency) };
    });
    this.repo.updateIncomeSheet({ date: sheet.date, entries });
  }
}
