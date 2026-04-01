import type { CategoryAllocation } from '../controllers/category_allocation.ts';
import { formatEur } from '../formatting.ts';

export class AssetBreakdown {
  private readonly allocations: CategoryAllocation[];

  constructor(allocations: CategoryAllocation[]) {
    this.allocations = allocations;
  }

  render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'card';
    section.setAttribute('aria-label', 'Asset breakdown');

    const stackedSegments = this.allocations
      .map(
        (a) =>
          `<div class="stacked-bar__segment" style="width:${a.percentage}%;background:${a.color}" title="${a.label}"></div>`,
      )
      .join('');

    const listItems = this.allocations
      .map(
        (a) => `
      <li class="breakdown__item">
        <span class="breakdown__emoji" aria-hidden="true">${a.emoji}</span>
        <span class="breakdown__name">${a.label}</span>
        <div class="breakdown__track" role="progressbar" aria-valuenow="${Math.round(a.percentage)}" aria-valuemin="0" aria-valuemax="100">
          <div class="breakdown__fill" style="width:${a.percentage}%;background:${a.color}"></div>
        </div>
        <span class="breakdown__pct" style="color:${a.color}">${Math.round(a.percentage)}%</span>
        <span class="breakdown__amount">${formatEur(a.cents)}</span>
      </li>
    `,
      )
      .join('');

    section.innerHTML = `
      <h2 class="card__title">Allocation</h2>
      <div class="stacked-bar" aria-hidden="true">${stackedSegments}</div>
      <ul class="breakdown__list">${listItems}</ul>
    `;
    return section;
  }
}
