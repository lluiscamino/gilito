import { Money, Currencies } from 'ts-money';
import type { IncomeSource } from '../../lib/income/income_source.ts';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { EntryInput } from './entry_input.ts';
import type { NewIncomeSourceValue } from './new_income_source_value.ts';

export class IncomeInputController {
  private readonly repo: WealthRepository;

  constructor(repo: WealthRepository) {
    this.repo = repo;
  }

  getSourceInputs(): EntryInput[] {
    const latest = this.repo.getLatestIncomeSheet();
    if (!latest) return [];
    return latest.entries.map((e) => ({
      id: e.source.id,
      name: e.source.name,
      lastCents: e.amount.amount,
    }));
  }

  saveIncomeSheet(
    date: Date,
    values: ReadonlyMap<string, number>,
    newSources: readonly NewIncomeSourceValue[],
  ): void {
    const latest = this.repo.getLatestIncomeSheet();

    const entries = latest
      ? latest.entries.map((e) => {
          const euros = values.get(e.source.id);
          const cents = euros !== undefined ? Math.round(euros * 100) : e.amount.amount;
          return { source: e.source, amount: new Money(cents, Currencies.EUR) };
        })
      : [];

    for (const newSource of newSources) {
      const source: IncomeSource = {
        id: `${newSource.name}-${Date.now()}`,
        name: newSource.name,
      };
      entries.push({
        source,
        amount: new Money(Math.round(newSource.euros * 100), Currencies.EUR),
      });
    }

    this.repo.addIncomeSheet({ date, entries });
  }
}
