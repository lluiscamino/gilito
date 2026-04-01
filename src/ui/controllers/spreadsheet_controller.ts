import { Money, Currencies } from 'ts-money';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { SpreadsheetRow } from './spreadsheet_row.ts';

export class SpreadsheetController {
  private readonly repo: WealthRepository;

  constructor(repo: WealthRepository) {
    this.repo = repo;
  }

  getDates(): Date[] {
    return this.repo.getAllBalanceSheets().map((s) => s.date);
  }

  getRows(): SpreadsheetRow[] {
    const sheets = this.repo.getAllBalanceSheets();

    // Collect unique assets preserving first-seen order
    const seen = new Map<string, string>(); // id → name
    for (const sheet of sheets) {
      for (const snap of sheet.snapshots) {
        if (!seen.has(snap.asset.id)) seen.set(snap.asset.id, snap.asset.name);
      }
    }

    return [...seen.entries()].map(([id, name]) => ({
      assetId: id,
      assetName: name,
      values: sheets.map((sheet) => {
        const snap = sheet.snapshots.find((s) => s.asset.id === id);
        return snap?.value.amount ?? 0;
      }),
    }));
  }

  getTotals(): number[] {
    const rows = this.getRows();
    return this.getDates().map((_, i) => rows.reduce((sum, row) => sum + (row.values[i] ?? 0), 0));
  }

  updateCell(assetId: string, dateIndex: number, euros: number): void {
    const sheets = this.repo.getAllBalanceSheets();
    const sheet = sheets[dateIndex];
    if (!sheet) return;

    const snapshots = sheet.snapshots.map((s) => {
      if (s.asset.id !== assetId) return s;
      return { asset: s.asset, value: new Money(Math.round(euros * 100), Currencies.EUR) };
    });

    this.repo.updateBalanceSheet({ date: sheet.date, snapshots });
  }
}
