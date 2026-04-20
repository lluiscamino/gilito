export class MonthPickerRow {
  private readonly input: HTMLInputElement;

  constructor() {
    const now = new Date();
    this.input = document.createElement('input');
    this.input.type = 'month';
    this.input.className = 'month-input';
    this.input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  render(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'month-picker-row';
    row.innerHTML = `<span class="month-picker-label">Month</span>`;
    row.append(this.input);
    return row;
  }

  getDate(): Date {
    const [year, month] = this.input.value.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }
}
