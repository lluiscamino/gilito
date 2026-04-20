import type { Allocations, AllocationEntry } from '../controllers/allocations.ts';
import { AllocationLevel } from '../controllers/allocations.ts';
import { formatMoney } from '../formatting.ts';

const LEVELS = [
  AllocationLevel.Overview,
  AllocationLevel.Category,
  AllocationLevel.Detail,
  AllocationLevel.Assets,
];
const DEFAULT_LEVEL = AllocationLevel.Category;

export class AssetBreakdown {
  private readonly allocations: Allocations;

  constructor(allocations: Allocations) {
    this.allocations = allocations;
  }

  render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'card';
    section.setAttribute('aria-label', 'Asset breakdown');

    const title = document.createElement('h2');
    title.className = 'card__title';
    title.textContent = 'Allocation';

    const body = new BreakdownBody(this.getEntries(DEFAULT_LEVEL));
    const picker = new LevelPicker(DEFAULT_LEVEL, (level) => {
      body.update(this.getEntries(level));
    });

    section.append(title, picker.render(), body.render());
    return section;
  }

  private getEntries(level: AllocationLevel): readonly AllocationEntry[] {
    return this.allocations[level.id];
  }
}

class LevelPicker {
  private readonly defaultLevel: AllocationLevel;
  private readonly onChange: (level: AllocationLevel) => void;

  constructor(defaultLevel: AllocationLevel, onChange: (level: AllocationLevel) => void) {
    this.defaultLevel = defaultLevel;
    this.onChange = onChange;
  }

  render(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'level-picker';
    element.setAttribute('role', 'group');
    element.setAttribute('aria-label', 'Detail level');

    const group = new LevelPickerButtonsGroup(LEVELS, this.defaultLevel, this.onChange);
    element.append(...group.render());
    return element;
  }
}

class LevelPickerButtonsGroup {
  private readonly buttonsByKey: Map<AllocationLevel, LevelPickerButton>;
  private currentKey: AllocationLevel;

  constructor(
    levels: readonly AllocationLevel[],
    defaultLevel: AllocationLevel,
    onChange: (level: AllocationLevel) => void,
  ) {
    this.currentKey = defaultLevel;
    this.buttonsByKey = new Map(
      levels.map((level) => [
        level,
        new LevelPickerButton(level.name, level === defaultLevel, () => {
          if (level === this.currentKey) return;
          this.buttonsByKey.get(this.currentKey)!.setActive(false);
          this.currentKey = level;
          this.buttonsByKey.get(level)!.setActive(true);
          onChange(level);
        }),
      ]),
    );
  }

  render(): HTMLButtonElement[] {
    return [...this.buttonsByKey.values()].map((b) => b.render());
  }
}

class LevelPickerButton {
  private readonly element: HTMLButtonElement;

  constructor(label: string, active: boolean, onClick: () => void) {
    this.element = document.createElement('button');
    this.element.type = 'button';
    this.element.className = 'level-picker__btn';
    this.element.textContent = label;
    if (active) this.element.classList.add('level-picker__btn--active');
    this.element.addEventListener('click', onClick);
  }

  render(): HTMLButtonElement {
    return this.element;
  }

  setActive(active: boolean): void {
    this.element.classList.toggle('level-picker__btn--active', active);
  }
}

class BreakdownBody {
  private bar: HTMLElement;
  private list: HTMLElement;
  private readonly wrapper: HTMLElement;

  constructor(entries: readonly AllocationEntry[]) {
    this.wrapper = document.createElement('div');
    this.bar = renderBar(entries);
    this.list = renderList(entries);
    this.wrapper.append(this.bar, this.list);
  }

  render(): HTMLElement {
    return this.wrapper;
  }

  update(entries: readonly AllocationEntry[]): void {
    const nextBar = renderBar(entries);
    const nextList = renderList(entries);
    this.bar.replaceWith(nextBar);
    this.list.replaceWith(nextList);
    this.bar = nextBar;
    this.list = nextList;
  }
}

function renderBar(entries: readonly AllocationEntry[]): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'stacked-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = entries
    .map(
      (a) =>
        `<div class="stacked-bar__segment" style="width:${a.percentage}%;background:${a.color}" title="${a.label}"></div>`,
    )
    .join('');
  return bar;
}

function renderList(entries: readonly AllocationEntry[]): HTMLElement {
  const list = document.createElement('ul');
  list.className = 'breakdown__list';
  list.innerHTML = entries
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
