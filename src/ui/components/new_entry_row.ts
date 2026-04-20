export class NewEntryRow {
  readonly nameEl: HTMLInputElement;
  readonly valueEl: HTMLInputElement;
  private readonly li: HTMLLIElement;

  constructor(
    list: HTMLUListElement,
    options: { namePlaceholder?: string; extraFields?: HTMLElement[] } = {},
  ) {
    const { namePlaceholder = 'Name', extraFields = [] } = options;

    this.li = document.createElement('li');
    this.li.className = 'new-asset-row';

    this.nameEl = document.createElement('input');
    this.nameEl.type = 'text';
    this.nameEl.placeholder = namePlaceholder;
    this.nameEl.className = 'new-asset-name';
    this.nameEl.setAttribute('aria-label', namePlaceholder);

    const field = document.createElement('div');
    field.className = 'asset-input-row__field';
    field.innerHTML = `<span class="asset-input-row__currency">€</span>`;

    this.valueEl = document.createElement('input');
    this.valueEl.type = 'number';
    this.valueEl.min = '0';
    this.valueEl.step = 'any';
    this.valueEl.inputMode = 'decimal';
    this.valueEl.placeholder = '0.00';
    this.valueEl.className = 'asset-input-row__input';
    this.valueEl.setAttribute('aria-label', 'Amount');
    field.append(this.valueEl);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-asset';
    removeBtn.setAttribute('aria-label', 'Remove');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      this.li.remove();
      const items = list.querySelectorAll<HTMLLIElement>('.new-asset-row');
      items.forEach((item, i) =>
        item.classList.toggle('asset-input-row--bordered', i < items.length - 1),
      );
    });

    this.li.append(this.nameEl, ...extraFields, field, removeBtn);

    // All previously-added rows get a bottom border; new row has none (it's last)
    list
      .querySelectorAll<HTMLLIElement>('.new-asset-row')
      .forEach((item) => item.classList.add('asset-input-row--bordered'));
  }

  render(): HTMLLIElement {
    return this.li;
  }
}
