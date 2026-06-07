import type { AllocationEntry } from '../controllers/allocations.ts';

export class BreakdownBar {
  private readonly entries: readonly AllocationEntry[];

  constructor(entries: readonly AllocationEntry[]) {
    this.entries = entries;
  }

  render(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'stacked-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = this.entries
      .map(
        (a) =>
          `<div class="stacked-bar__segment" style="width:${a.percentage}%;background:${a.color}" title="${a.label}"></div>`,
      )
      .join('');
    return bar;
  }
}
