import {
  findCategoryById,
  isValidCategoryId,
  leafCategories,
} from '../../lib/assets/asset_category.ts';
import type { AssetCategoryId } from '../../lib/assets/asset_category_id.ts';
import type { SnapshotInputController } from '../controllers/snapshot_input_controller.ts';
import type { NewAssetValue } from '../controllers/new_asset_value.ts';
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

    const newEntryRows: Array<{ row: NewEntryRow; categoryEl: HTMLSelectElement }> = [];
    const newList = document.createElement('ul');
    newList.className = 'asset-input-list';

    const addAssetBtn = document.createElement('button');
    addAssetBtn.type = 'button';
    addAssetBtn.className = 'btn-add-asset';
    addAssetBtn.textContent = '+ Add Asset';
    addAssetBtn.addEventListener('click', () => {
      const categoryEl = makeCategorySelect();
      const row = new NewEntryRow(newList, {
        namePlaceholder: 'Asset name',
        extraFields: [categoryEl],
      });
      newEntryRows.push({ row, categoryEl });
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
        const values = new Map(entryRows.map((r) => [r.id, r.getEuros()]));

        const newAssets: NewAssetValue[] = newEntryRows
          .filter(
            ({ row, categoryEl }) =>
              row.nameEl.isConnected &&
              row.nameEl.value.trim() !== '' &&
              isValidCategoryId(categoryEl.value),
          )
          .map(({ row, categoryEl }) => ({
            name: row.nameEl.value.trim(),
            category: findCategoryById(categoryEl.value as AssetCategoryId),
            euros: parseFloat(row.valueEl.value) || 0,
          }));

        this.controller.saveSnapshot(date, values, newAssets);
        this.onSave();
      },
    }).render();
  }
}

function makeCategorySelect(): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'asset-category-select';
  select.setAttribute('aria-label', 'Asset category');
  for (const category of leafCategories()) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    select.append(option);
  }
  return select;
}
