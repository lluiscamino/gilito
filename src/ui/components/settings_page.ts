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
    const select = createCurrencySelect(this.settings.displayCurrency);
    const row = createCurrencyRow(select);
    const actions = createActions(this.onCancel);

    const form = createForm(row, actions, () => {
      this.onSave({ displayCurrency: select.value as Settings['displayCurrency'] });
    });

    const card = createCard(createTitle(), form);
    return createMain(card);
  }
}

function createMain(card: HTMLElement): HTMLElement {
  const main = document.createElement('main');
  main.className = 'settings-layout';
  main.append(card);
  return main;
}

function createCard(title: HTMLElement, form: HTMLElement): HTMLElement {
  const card = document.createElement('section');
  card.className = 'card';
  card.append(title, form);
  return card;
}

function createForm(row: HTMLElement, actions: HTMLElement, onSubmit: () => void): HTMLFormElement {
  const form = document.createElement('form');
  form.append(row, actions);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onSubmit();
  });
  return form;
}

function createTitle(): HTMLElement {
  const title = document.createElement('h2');
  title.className = 'settings__title';
  title.textContent = 'Settings';
  return title;
}

function createCurrencyRow(select: HTMLSelectElement): HTMLElement {
  const row = document.createElement('div');
  row.className = 'settings__row';

  const label = document.createElement('label');
  label.className = 'settings__label';
  label.textContent = 'Display currency';
  label.htmlFor = 'display-currency-select';

  row.append(label, select);
  return row;
}

function createActions(onCancel: () => void): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'settings__actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', onCancel);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn-confirm';
  saveBtn.textContent = 'Save';

  actions.append(cancelBtn, saveBtn);
  return actions;
}

function createCurrencySelect(selected: Settings['displayCurrency']): HTMLSelectElement {
  const select = document.createElement('select');
  select.id = 'display-currency-select';
  select.className = 'settings__select';
  for (const currency of SUPPORTED_CURRENCIES) {
    const option = document.createElement('option');
    option.value = currency;
    option.textContent = currency;
    if (currency === selected) option.selected = true;
    select.append(option);
  }
  return select;
}
