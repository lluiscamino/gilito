import { EntryInputRow } from './entry_input_row.ts';

export class ExistingEntryList {
  private readonly rows: EntryInputRow[];

  constructor(rows: EntryInputRow[]) {
    this.rows = rows;
  }

  render(): HTMLUListElement {
    const ul = document.createElement('ul');
    ul.className = 'asset-input-list';
    this.rows.forEach((row, i) => {
      const li = row.render();
      if (i < this.rows.length - 1) li.classList.add('asset-input-row--bordered');
      ul.append(li);
    });
    return ul;
  }
}
