import { Money } from 'ts-money';
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
      lastValue: e.amount,
    }));
  }

  getLastTaxPaid(): Money {
    return this.repo.getLatestIncomeSheet()?.taxPaid ?? new Money(0, 'EUR');
  }

  saveIncomeSheet(
    date: Date,
    values: ReadonlyMap<string, number>,
    newSources: readonly NewIncomeSourceValue[],
    taxPaid: number,
  ): void {
    const latest = this.repo.getLatestIncomeSheet();

    const entries = latest
      ? latest.entries.map((e) => {
          const amount = values.get(e.source.id);
          const cents = amount !== undefined ? Math.round(amount * 100) : e.amount.amount;
          return { source: e.source, amount: new Money(cents, e.source.currency) };
        })
      : [];

    for (const newSource of newSources) {
      const source: IncomeSource = {
        id: `${newSource.name}-${Date.now()}`,
        name: newSource.name,
        currency: newSource.currency,
      };
      entries.push({
        source,
        amount: new Money(Math.round(newSource.amount * 100), newSource.currency),
      });
    }

    this.repo.addIncomeSheet({
      date,
      entries,
      taxPaid: new Money(Math.round(taxPaid * 100), 'EUR'),
    });
  }
}
