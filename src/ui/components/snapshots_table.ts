import { formatEur } from '../formatting.ts';
import type { SpreadsheetController } from '../controllers/spreadsheet_controller.ts';
import { MoneyDeltaBadge } from './delta_badge.ts';

export class SnapshotsTable {
  private readonly controller: SpreadsheetController;

  constructor(controller: SpreadsheetController) {
    this.controller = controller;
  }

  render(): HTMLElement {
    const main = document.createElement('main');
    main.className = 'snapshots-layout';

    const dates = this.controller.getDates();
    const rows = this.controller.getRows();
    const totals = this.controller.getTotals();

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';

    const table = document.createElement('table');
    table.className = 'snapshots-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.innerHTML = `<th class="col-date">Date</th><th>Total</th><th>Change</th>`;
    for (const row of rows) {
      const th = document.createElement('th');
      th.textContent = row.assetName;
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement('tbody');
    for (let i = dates.length - 1; i >= 0; i--) {
      const tr = document.createElement('tr');

      const dateTd = document.createElement('td');
      dateTd.className = 'col-date';
      dateTd.textContent = dates[i].toLocaleDateString('en', { month: 'short', year: 'numeric' });
      tr.append(dateTd);

      const totalTd = document.createElement('td');
      totalTd.className = 'col-total';
      totalTd.textContent = formatEur(totals[i]);
      tr.append(totalTd);

      const deltaTd = document.createElement('td');
      deltaTd.className = 'col-delta';
      if (i > 0) deltaTd.append(makeDeltaEl(totals[i], totals[i - 1]));
      tr.append(deltaTd);

      for (const row of rows) {
        const td = document.createElement('td');
        td.append(this.makeInput(row.assetId, i, row.values[i]));
        tr.append(td);
      }

      tbody.append(tr);
    }

    table.append(thead, tbody);
    wrap.append(table);
    main.append(wrap);
    return main;
  }

  private makeInput(assetId: string, dateIndex: number, cents: number): HTMLInputElement {
    let current = cents / 100;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = 'any';
    input.inputMode = 'decimal';
    input.className = 'cell-input';
    input.value = current.toFixed(2);

    input.addEventListener('focus', () => input.select());

    input.addEventListener('blur', () => {
      const parsed = parseFloat(input.value);
      if (isNaN(parsed) || parsed < 0) {
        input.value = current.toFixed(2);
        return;
      }
      if (parsed !== current) {
        current = parsed;
        this.controller.updateCell(assetId, dateIndex, parsed);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') {
        input.value = current.toFixed(2);
        input.blur();
      }
    });

    return input;
  }
}

function makeDeltaEl(cents: number, prevCents: number): HTMLElement {
  const diff = cents - prevCents;
  return new MoneyDeltaBadge(diff).render();
}
