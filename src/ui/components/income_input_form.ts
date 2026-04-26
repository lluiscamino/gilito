import type { Money } from 'ts-money';
import { Currency, SUPPORTED_CURRENCIES } from '../../lib/fx/currency.ts';
import type { IncomeInputController } from '../controllers/income_input_controller.ts';
import type { NewIncomeSourceValue } from '../controllers/new_income_source_value.ts';
import { getCurrencySymbol, parseDecimalInput, toDecimal } from '../formatting.ts';
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

    const newEntryRows: Array<{ row: NewEntryRow; currencyEl: HTMLSelectElement }> = [];
    const newList = document.createElement('ul');
    newList.className = 'asset-input-list';

    const addSourceBtn = document.createElement('button');
    addSourceBtn.type = 'button';
    addSourceBtn.className = 'btn-add-asset';
    addSourceBtn.textContent = '+ Add Source';
    addSourceBtn.addEventListener('click', () => {
      const currencyEl = makeCurrencySelect();
      const row = new NewEntryRow(newList, {
        namePlaceholder: 'Source name',
        extraFields: [currencyEl],
      });
      newEntryRows.push({ row, currencyEl });
      newList.append(row.render());
      row.nameEl.focus();
    });

    const taxPaidInput = makeTaxPaidInput(this.controller.getLastTaxPaid());

    const card = document.createElement('section');
    card.className = 'card';
    card.append(
      monthPicker.render(),
      existingEntryList.render(),
      newList,
      addSourceBtn,
      taxPaidInput,
    );

    return new InputFormLayout({
      title: 'Log Income',
      onCancel: this.onCancel,
      contents: card,
      confirmText: 'Save Income',
      onConfirm: () => {
        const date = monthPicker.getDate();
        const values = new Map(entryRows.map((r) => [r.id, r.getAmount()]));

        const newSources: NewIncomeSourceValue[] = newEntryRows
          .filter(({ row }) => row.nameEl.isConnected && row.nameEl.value.trim() !== '')
          .map(({ row, currencyEl }) => ({
            name: row.nameEl.value.trim(),
            amount: parseDecimalInput(row.valueEl.value, 0),
            currency: currencyEl.value as Currency,
          }));

        const taxPaid = parseDecimalInput(taxPaidInput.querySelector('input')!.value, 0);
        this.controller.saveIncomeSheet(date, values, newSources, taxPaid);
        this.onSave();
      },
    }).render();
  }
}

function makeTaxPaidInput(lastTaxPaid: Money): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'asset-input-row';

  const label = document.createElement('div');
  label.className = 'asset-input-row__meta';
  label.innerHTML = `<span class="asset-input-row__name">Tax Paid</span>`;

  const field = document.createElement('div');
  field.className = 'asset-input-row__field';
  field.innerHTML = `<span class="asset-input-row__currency">${getCurrencySymbol(lastTaxPaid.currency)}</span>`;

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = 'any';
  input.inputMode = 'decimal';
  input.className = 'asset-input-row__input';
  input.setAttribute('aria-label', 'Tax paid');
  input.value = toDecimal(lastTaxPaid).toFixed(2);
  field.append(input);

  wrap.append(label, field);
  return wrap;
}

function makeCurrencySelect(): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'asset-currency-select';
  select.setAttribute('aria-label', 'Source currency');
  for (const currency of SUPPORTED_CURRENCIES) {
    const option = document.createElement('option');
    option.value = currency;
    option.textContent = currency;
    select.append(option);
  }
  return select;
}
