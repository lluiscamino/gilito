import type { IncomeSource } from '../../lib/income/income_source.ts';
import { SUPPORTED_CURRENCIES } from '../../lib/fx/currency.ts';
import type { Currency } from '../../lib/fx/currency.ts';

export class IncomeSourceManager {
  private readonly sources: readonly IncomeSource[];
  private readonly onUpdate: (sourceId: string, currency: Currency) => void;

  constructor(
    sources: readonly IncomeSource[],
    onUpdate: (sourceId: string, currency: Currency) => void,
  ) {
    this.sources = sources;
    this.onUpdate = onUpdate;
  }

  render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'asset-manager card';

    const title = document.createElement('h2');
    title.className = 'asset-manager__title';
    title.textContent = 'Manage Income Sources';

    const list = document.createElement('ul');
    list.className = 'asset-manager__list';

    for (const source of this.sources) {
      list.append(this.makeRow(source));
    }

    section.append(title, list);
    return section;
  }

  private makeRow(source: IncomeSource): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'asset-manager__row';

    const name = document.createElement('span');
    name.className = 'asset-manager__name';
    name.textContent = source.name;

    const currencySelect = document.createElement('select');
    currencySelect.className = 'asset-manager__select';
    currencySelect.setAttribute('aria-label', `Currency for ${source.name}`);
    for (const currency of SUPPORTED_CURRENCIES) {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      if (currency === source.currency) option.selected = true;
      currencySelect.append(option);
    }

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'asset-manager__save btn-secondary';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      this.onUpdate(source.id, currencySelect.value as Currency);
    });

    li.append(name, currencySelect, saveBtn);
    return li;
  }
}
