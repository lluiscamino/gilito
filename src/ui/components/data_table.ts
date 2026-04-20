import { Money } from 'ts-money';
import { formatMoney, toDecimal } from '../formatting.ts';
import { MoneyDeltaBadge } from './delta_badge.ts';

export interface TableColumn {
  readonly id: string;
  readonly name: string;
  readonly currency?: string;
}

export interface TableRow {
  readonly date: Date;
  readonly values: Map<string, Money>;
  readonly total: Money;
}

export class DataTable {
  private readonly columns: readonly TableColumn[];
  private readonly rows: readonly TableRow[];
  private readonly onUpdateCell: (id: string, dateIndex: number, amount: number) => void;

  constructor(
    columns: readonly TableColumn[],
    rows: readonly TableRow[],
    onUpdateCell: (id: string, dateIndex: number, amount: number) => void,
  ) {
    this.columns = columns;
    this.rows = rows;
    this.onUpdateCell = onUpdateCell;
  }

  render(): HTMLElement {
    const main = document.createElement('main');
    main.className = 'snapshots-layout';

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';

    const table = document.createElement('table');
    table.className = 'snapshots-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.innerHTML = `<th class="col-date">Date</th><th>Total</th><th>Change</th>`;
    for (const col of this.columns) {
      const th = document.createElement('th');
      th.textContent = col.currency ? `${col.name} (${col.currency})` : col.name;
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement('tbody');
    for (let i = this.rows.length - 1; i >= 0; i--) {
      const row = this.rows[i];
      const tr = document.createElement('tr');

      const dateTd = document.createElement('td');
      dateTd.className = 'col-date';
      dateTd.textContent = row.date.toLocaleDateString('en', { month: 'short', year: 'numeric' });
      tr.append(dateTd);

      const totalTd = document.createElement('td');
      totalTd.className = 'col-total';
      totalTd.textContent = formatMoney(row.total);
      tr.append(totalTd);

      const deltaTd = document.createElement('td');
      deltaTd.className = 'col-delta';
      if (i > 0) deltaTd.append(makeDeltaEl(row.total, this.rows[i - 1].total));
      tr.append(deltaTd);

      for (const col of this.columns) {
        const money = row.values.get(col.id);
        const td = document.createElement('td');
        td.append(this.makeInput(col.id, i, money));
        tr.append(td);
      }

      tbody.append(tr);
    }

    table.append(thead, tbody);
    wrap.append(table);
    main.append(wrap);
    return main;
  }

  private makeInput(id: string, dateIndex: number, money: Money | undefined): HTMLInputElement {
    let current = money ? toDecimal(money) : 0;

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
        this.onUpdateCell(id, dateIndex, parsed);
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

function makeDeltaEl(total: Money, prevTotal: Money): HTMLElement {
  return new MoneyDeltaBadge(new Money(total.amount - prevTotal.amount, total.currency)).render();
}
