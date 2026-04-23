import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import { IncomeSpreadsheetController } from '../controllers/income_spreadsheet_controller.ts';
import { DataTable } from './data_table.ts';
import { IncomeChart } from './income_chart.ts';

export class IncomePage {
  private readonly repo: WealthRepository;
  private readonly converter: CurrencyConverter;

  constructor(repo: WealthRepository, converter: CurrencyConverter) {
    this.repo = repo;
    this.converter = converter;
  }

  render(): HTMLElement {
    const wrap = document.createElement('div');

    const chartSection = document.createElement('div');
    chartSection.className = 'income-chart-section';
    chartSection.append(new IncomeChart(this.repo.getAllIncomeSheets(), this.converter).render());

    const ctrl = new IncomeSpreadsheetController(this.repo, this.converter);
    const tableEl = new DataTable(ctrl.getColumns(), ctrl.getRows(), (id, i, amount) =>
      ctrl.updateCell(id, i, amount),
    ).render();

    wrap.append(chartSection, tableEl);
    return wrap;
  }
}
