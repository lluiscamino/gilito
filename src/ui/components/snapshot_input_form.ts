import type { AssetCategory } from '../../lib/assets/asset_category.ts';
import { Currency, SUPPORTED_CURRENCIES } from '../../lib/fx/currency.ts';
import type { SnapshotInputController } from '../controllers/snapshot_input_controller.ts';
import type { NewAssetValue } from '../controllers/new_asset_value.ts';
import { parseDecimalInput } from '../formatting.ts';
import { EntryInputRow } from './entry_input_row.ts';
import { MonthPickerRow } from './month_picker_row.ts';
import { NewEntryRow } from './new_entry_row.ts';
import { ExistingEntryList } from './existing_entry_list.ts';
import { InputFormLayout } from './input_form_layout.ts';

export class SnapshotInputForm {
  private readonly controller: SnapshotInputController;
  private readonly onSave: () => void;
  private readonly onCancel: () => void;

  constructor(controller: SnapshotInputController, onSave: () => void, onCancel: () => void) {
    this.controller = controller;
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  render(): HTMLElement {
    const monthPicker = new MonthPickerRow();
    const entryRows = this.controller.getEntryInputs().map((input) => new EntryInputRow(input));
    const existingEntryList = new ExistingEntryList(entryRows);

    const newEntryRows: Array<{
      row: NewEntryRow;
      categoryEl: HTMLSelectElement;
      currencyEl: HTMLSelectElement;
    }> = [];
    const newList = document.createElement('ul');
    newList.className = 'asset-input-list';

    const addAssetBtn = document.createElement('button');
    addAssetBtn.type = 'button';
    addAssetBtn.className = 'btn-add-asset';
    addAssetBtn.textContent = '+ Add Asset';
    addAssetBtn.addEventListener('click', () => {
      const categoryEl = makeCategorySelect(this.controller.getCategories());
      const currencyEl = makeCurrencySelect();
      const row = new NewEntryRow(newList, {
        namePlaceholder: 'Asset name',
        extraFields: [categoryEl, currencyEl],
      });
      newEntryRows.push({ row, categoryEl, currencyEl });
      newList.append(row.render());
      row.nameEl.focus();
    });

    const card = document.createElement('section');
    card.className = 'card';
    card.append(monthPicker.render(), existingEntryList.render(), newList, addAssetBtn);

    return new InputFormLayout({
      title: 'New Snapshot',
      onCancel: this.onCancel,
      contents: card,
      confirmText: 'Save Snapshot',
      onConfirm: () => {
        const date = monthPicker.getDate();
        const values = new Map(entryRows.map((r) => [r.id, r.getAmount()]));

        const newAssets: NewAssetValue[] = newEntryRows
          .filter(({ row }) => row.nameEl.isConnected && row.nameEl.value.trim() !== '')
          .map(({ row, categoryEl, currencyEl }) => ({
            name: row.nameEl.value.trim(),
            categoryId: categoryEl.value,
            amount: parseDecimalInput(row.valueEl.value, 0),
            currency: currencyEl.value as Currency,
          }));

        this.controller.saveSnapshot(date, values, newAssets);
        this.onSave();
      },
    }).render();
  }
}

function makeCategorySelect(categories: AssetCategory[]): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'asset-category-select';
  select.setAttribute('aria-label', 'Asset category');
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    select.append(option);
  }
  return select;
}

function makeCurrencySelect(): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'asset-currency-select';
  select.setAttribute('aria-label', 'Asset currency');
  for (const currency of SUPPORTED_CURRENCIES) {
    const option = document.createElement('option');
    option.value = currency;
    option.textContent = currency;
    select.append(option);
  }
  return select;
}
