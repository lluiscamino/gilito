import { AssetCategory } from '../../lib/assets/asset_category.ts';
import type { SnapshotInputController } from '../controllers/snapshot_input_controller.ts';
import type { NewAssetValue } from '../controllers/new_asset_value.ts';
import { formatEur } from '../formatting.ts';

const CATEGORY_LABELS: Record<string, string> = {
  [AssetCategory.CASH]: 'Cash',
  [AssetCategory.STOCKS]: 'Stocks',
  [AssetCategory.PROPERTY]: 'Property',
  [AssetCategory.CRYPTO]: 'Crypto',
};

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthInput(value: string): Date {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

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
    const inputs = this.controller.getAssetInputs();

    const main = document.createElement('main');
    main.className = 'snapshot-layout';

    // ── Title row ──────────────────────────────────────────────────
    const titleRow = document.createElement('div');
    titleRow.className = 'snapshot-title-row';
    titleRow.innerHTML = `<h1 class="snapshot-title">New Snapshot</h1>`;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', this.onCancel);
    titleRow.append(cancelBtn);

    // ── Card ───────────────────────────────────────────────────────
    const card = document.createElement('section');
    card.className = 'card';

    // Month picker
    const monthRow = document.createElement('div');
    monthRow.className = 'month-picker-row';
    monthRow.innerHTML = `<span class="month-picker-label">Month</span>`;

    const monthInput = document.createElement('input');
    monthInput.type = 'month';
    monthInput.className = 'month-input';
    monthInput.value = currentMonthValue();
    monthRow.append(monthInput);

    // Existing assets
    const existingInputs: Array<{ el: HTMLInputElement; id: string; lastCents: number }> = [];
    const existingList = document.createElement('ul');
    existingList.className = 'asset-input-list';

    for (const [i, asset] of inputs.entries()) {
      const li = document.createElement('li');
      li.className = 'asset-input-row';
      if (i < inputs.length - 1) li.classList.add('asset-input-row--bordered');

      const meta = document.createElement('div');
      meta.className = 'asset-input-row__meta';
      meta.innerHTML = `
        <span class="asset-input-row__name">${asset.name}</span>
        <span class="asset-input-row__hint">Last: ${formatEur(asset.lastCents)}</span>
      `;

      const field = document.createElement('div');
      field.className = 'asset-input-row__field';
      field.innerHTML = `<span class="asset-input-row__currency">€</span>`;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = 'any';
      input.inputMode = 'decimal';
      input.placeholder = (asset.lastCents / 100).toFixed(2);
      input.className = 'asset-input-row__input';
      input.setAttribute('aria-label', `New value for ${asset.name}`);

      field.append(input);
      li.append(meta, field);
      existingList.append(li);
      existingInputs.push({ el: input, id: asset.id, lastCents: asset.lastCents });
    }

    // New assets
    const newAssetEls: Array<{
      nameEl: HTMLInputElement;
      categoryEl: HTMLSelectElement;
      valueEl: HTMLInputElement;
    }> = [];
    const newList = document.createElement('ul');
    newList.className = 'asset-input-list';

    const addAssetBtn = document.createElement('button');
    addAssetBtn.type = 'button';
    addAssetBtn.className = 'btn-add-asset';
    addAssetBtn.textContent = '+ Add Asset';
    addAssetBtn.addEventListener('click', () => {
      const { li, nameEl, categoryEl, valueEl } = this.makeNewAssetRow(newList);
      newAssetEls.push({ nameEl, categoryEl, valueEl });
      newList.append(li);
      nameEl.focus();
    });

    card.append(monthRow, existingList, newList, addAssetBtn);

    // ── Confirm ────────────────────────────────────────────────────
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-confirm';
    confirmBtn.type = 'button';
    confirmBtn.textContent = 'Save Snapshot';
    confirmBtn.addEventListener('click', () => {
      const date = parseMonthInput(monthInput.value);

      const values = new Map<string, number>();
      for (const { el, id, lastCents } of existingInputs) {
        const raw = el.value.trim();
        const euros = raw !== '' ? parseFloat(raw) : lastCents / 100;
        values.set(id, isNaN(euros) ? lastCents / 100 : euros);
      }

      const newAssets: NewAssetValue[] = newAssetEls
        .filter((r) => r.nameEl.isConnected && r.nameEl.value.trim() !== '')
        .map((r) => ({
          name: r.nameEl.value.trim(),
          category: r.categoryEl.value as (typeof AssetCategory)[keyof typeof AssetCategory],
          euros: parseFloat(r.valueEl.value) || 0,
        }));

      this.controller.saveSnapshot(date, values, newAssets);
      this.onSave();
    });

    main.append(titleRow, card, confirmBtn);
    return main;
  }

  private makeNewAssetRow(list: HTMLUListElement): {
    li: HTMLLIElement;
    nameEl: HTMLInputElement;
    categoryEl: HTMLSelectElement;
    valueEl: HTMLInputElement;
  } {
    const li = document.createElement('li');
    li.className = 'new-asset-row';

    const nameEl = document.createElement('input');
    nameEl.type = 'text';
    nameEl.placeholder = 'Asset name';
    nameEl.className = 'new-asset-name';
    nameEl.setAttribute('aria-label', 'New asset name');

    const categoryEl = document.createElement('select');
    categoryEl.className = 'asset-category-select';
    categoryEl.setAttribute('aria-label', 'Asset category');
    for (const [key, value] of Object.entries(AssetCategory)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = CATEGORY_LABELS[value] ?? key;
      categoryEl.append(option);
    }

    const field = document.createElement('div');
    field.className = 'asset-input-row__field';
    field.innerHTML = `<span class="asset-input-row__currency">€</span>`;

    const valueEl = document.createElement('input');
    valueEl.type = 'number';
    valueEl.min = '0';
    valueEl.step = 'any';
    valueEl.inputMode = 'decimal';
    valueEl.placeholder = '0.00';
    valueEl.className = 'asset-input-row__input';
    valueEl.setAttribute('aria-label', 'Asset value');

    field.append(valueEl);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-asset';
    removeBtn.setAttribute('aria-label', 'Remove asset');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      li.remove();
      // Re-border last item in new list
      const items = list.querySelectorAll<HTMLLIElement>('.new-asset-row');
      items.forEach((item, i) =>
        item.classList.toggle('asset-input-row--bordered', i < items.length - 1),
      );
    });

    li.append(nameEl, categoryEl, field, removeBtn);

    // Update borders in new list
    const existing = list.querySelectorAll<HTMLLIElement>('.new-asset-row');
    existing.forEach((item) => item.classList.add('asset-input-row--bordered'));

    return { li, nameEl, categoryEl, valueEl };
  }
}
