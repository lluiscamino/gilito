import type { IncomeInputController } from '../controllers/income_input_controller.ts';
import type { NewIncomeSourceValue } from '../controllers/new_income_source_value.ts';
import { EntryInputRow } from './entry_input_row.ts';
import { MonthPickerRow } from './month_picker_row.ts';
import { NewEntryRow } from './new_entry_row.ts';
import { ExistingEntryList } from './existing_entry_list.ts';
import { InputFormLayout } from './input_form_layout.ts';

export class IncomeInputForm {
  private readonly controller: IncomeInputController;
  private readonly onSave: () => void;
  private readonly onCancel: () => void;

  constructor(controller: IncomeInputController, onSave: () => void, onCancel: () => void) {
    this.controller = controller;
    this.onSave = onSave;
    this.onCancel = onCancel;
  }

  render(): HTMLElement {
    const monthPicker = new MonthPickerRow();
    const entryRows = this.controller.getSourceInputs().map((input) => new EntryInputRow(input));
    const existingEntryList = new ExistingEntryList(entryRows);

    const newEntryRows: NewEntryRow[] = [];
    const newList = document.createElement('ul');
    newList.className = 'asset-input-list';

    const addSourceBtn = document.createElement('button');
    addSourceBtn.type = 'button';
    addSourceBtn.className = 'btn-add-asset';
    addSourceBtn.textContent = '+ Add Source';
    addSourceBtn.addEventListener('click', () => {
      const row = new NewEntryRow(newList, { namePlaceholder: 'Source name' });
      newEntryRows.push(row);
      newList.append(row.render());
      row.nameEl.focus();
    });

    const card = document.createElement('section');
    card.className = 'card';
    card.append(monthPicker.render(), existingEntryList.render(), newList, addSourceBtn);

    return new InputFormLayout({
      title: 'Log Income',
      onCancel: this.onCancel,
      contents: card,
      confirmText: 'Save Income',
      onConfirm: () => {
        const date = monthPicker.getDate();
        const values = new Map(entryRows.map((r) => [r.id, r.getEuros()]));

        const newSources: NewIncomeSourceValue[] = newEntryRows
          .filter((r) => r.nameEl.isConnected && r.nameEl.value.trim() !== '')
          .map((r) => ({
            name: r.nameEl.value.trim(),
            euros: parseFloat(r.valueEl.value) || 0,
          }));

        this.controller.saveIncomeSheet(date, values, newSources);
        this.onSave();
      },
    }).render();
  }
}
