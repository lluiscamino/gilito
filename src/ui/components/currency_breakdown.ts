import type { AllocationEntry } from '../controllers/allocations.ts';
import { BreakdownBar } from './breakdown_bar.ts';
import { BreakdownList } from './breakdown_list.ts';

export class CurrencyBreakdown {
  private readonly entries: readonly AllocationEntry[];

  constructor(entries: readonly AllocationEntry[]) {
    this.entries = entries;
  }

  render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'card';
    section.setAttribute('aria-label', 'Currency exposure');

    const title = document.createElement('h2');
    title.className = 'card__title';
    title.textContent = 'Currencies';

    section.append(
      title,
      new BreakdownBar(this.entries).render(),
      new BreakdownList(this.entries).render(),
    );
    return section;
  }
}
