import { SUPPORTED_CURRENCIES } from '../../lib/fx/currency.ts';
import type { Settings } from '../settings.ts';

export class SettingsPage {
  private readonly settings: Settings;
  private readonly onSave: (settings: Settings) => void;
  private readonly onCancel: () => void;

  constructor(settings: Settings, onSave: (settings: Settings) => void, onCancel: () => void) {
    this.settings = settings;
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  render(): HTMLElement {
    const main = document.createElement('main');
    main.className = 'settings-layout';

    const card = document.createElement('section');
    card.className = 'card';

    const title = document.createElement('h2');
    title.className = 'settings__title';
    title.textContent = 'Settings';

    const row = document.createElement('div');
    row.className = 'settings__row';

    const label = document.createElement('label');
    label.className = 'settings__label';
    label.textContent = 'Display currency';
    label.htmlFor = 'display-currency-select';

    const select = document.createElement('select');
    select.id = 'display-currency-select';
    select.className = 'settings__select';
    for (const currency of SUPPORTED_CURRENCIES) {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      if (currency === this.settings.displayCurrency) option.selected = true;
      select.append(option);
    }

    row.append(label, select);

    const actions = document.createElement('div');
    actions.className = 'settings__actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', this.onCancel);

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-confirm';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      this.onSave({ displayCurrency: select.value as Settings['displayCurrency'] });
    });

    actions.append(cancelBtn, saveBtn);
    card.append(title, row, actions);
    main.append(card);
    return main;
  }
}
