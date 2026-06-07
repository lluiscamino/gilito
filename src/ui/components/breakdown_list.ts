import type { AllocationEntry } from '../controllers/allocations.ts';
import { formatMoney } from '../formatting.ts';

export class BreakdownList {
  private readonly entries: readonly AllocationEntry[];

  constructor(entries: readonly AllocationEntry[]) {
    this.entries = entries;
  }

  render(): HTMLElement {
    const list = document.createElement('ul');
    list.className = 'breakdown__list';
    list.innerHTML = this.entries
      .map(
        (a) => `
        <li class="breakdown__item">
          <span class="breakdown__emoji" aria-hidden="true">${a.emoji}</span>
          <span class="breakdown__name">${a.label}</span>
          <div class="breakdown__track" role="progressbar" aria-valuenow="${Math.round(a.percentage)}" aria-valuemin="0" aria-valuemax="100">
            <div class="breakdown__fill" style="width:${a.percentage}%;background:${a.color}"></div>
          </div>
          <span class="breakdown__pct" style="color:${a.color}">${Math.round(a.percentage)}%</span>
          <span class="breakdown__amount">${formatMoney(a.amount)}</span>
        </li>`,
      )
      .join('');
    return list;
  }
}
