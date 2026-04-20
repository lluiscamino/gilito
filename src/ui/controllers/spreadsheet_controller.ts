import { Money } from 'ts-money';
import type { Currency } from '../../lib/fx/currency.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import { sumInDisplayCurrency } from '../../lib/fx/money.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { TableColumn, TableRow } from '../components/data_table.ts';

export class SpreadsheetController {
  private readonly repo: WealthRepository;
  private readonly converter: CurrencyConverter;

  constructor(repo: WealthRepository, converter: CurrencyConverter) {
    this.repo = repo;
    this.converter = converter;
  }

  getColumns(): TableColumn[] {
    const seen = new Map<string, { name: string; currency: Currency }>();
    for (const sheet of this.repo.getAllBalanceSheets()) {
      for (const snap of sheet.snapshots) {
        if (!seen.has(snap.asset.id)) {
          seen.set(snap.asset.id, { name: snap.asset.name, currency: snap.asset.currency });
        }
      }
    }
    return [...seen.entries()].map(([id, { name, currency }]) => ({ id, name, currency }));
  }

  getRows(): TableRow[] {
    return this.repo.getAllBalanceSheets().map((sheet) => {
      const values = new Map(sheet.snapshots.map((s) => [s.asset.id, s.value]));
      const total = sumInDisplayCurrency(
        sheet.snapshots.map((s) => s.value),
        this.converter,
      );
      return { date: sheet.date, values, total };
    });
  }

  updateCell(id: string, dateIndex: number, amount: number): void {
    const sheets = this.repo.getAllBalanceSheets();
    const sheet = sheets[dateIndex];
    if (!sheet) return;
    const snapshots = sheet.snapshots.map((s) => {
      if (s.asset.id !== id) return s;
      return { asset: s.asset, value: new Money(Math.round(amount * 100), s.asset.currency) };
    });
    this.repo.updateBalanceSheet({ date: sheet.date, snapshots });
  }
}
