import type { EntryInput } from '../controllers/entry_input.ts';
import { formatEur } from '../formatting.ts';

export class EntryInputRow {
  readonly id: string;
  private readonly lastCents: number;
  private readonly input: HTMLInputElement;
  private readonly name: string;

  constructor(entry: EntryInput) {
    this.id = entry.id;
    this.name = entry.name;
    this.lastCents = entry.lastCents;

    this.input = document.createElement('input');
    this.input.type = 'number';
    this.input.min = '0';
    this.input.step = 'any';
    this.input.inputMode = 'decimal';
    this.input.placeholder = (entry.lastCents / 100).toFixed(2);
    this.input.className = 'asset-input-row__input';
    this.input.setAttribute('aria-label', `Value for ${entry.name}`);
  }

  render(): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'asset-input-row';

    const meta = document.createElement('div');
    meta.className = 'asset-input-row__meta';
    meta.innerHTML = `
      <span class="asset-input-row__name">${this.name}</span>
      <span class="asset-input-row__hint">Last: ${formatEur(this.lastCents)}</span>
    `;

    const field = document.createElement('div');
    field.className = 'asset-input-row__field';
    field.innerHTML = `<span class="asset-input-row__currency">€</span>`;
    field.append(this.input);

    li.append(meta, field);
    return li;
  }

  getEuros(): number {
    const raw = this.input.value.trim();
    const euros = raw !== '' ? parseFloat(raw) : this.lastCents / 100;
    return isNaN(euros) ? this.lastCents / 100 : euros;
  }
}
