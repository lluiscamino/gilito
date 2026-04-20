import Navigo from 'navigo';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import { FixedRateCurrencyConverter } from '../../lib/fx/fixed_rate_currency_converter.ts';
import { DashboardController } from '../controllers/dashboard_controller.ts';
import { IncomeInputController } from '../controllers/income_input_controller.ts';
import { IncomeSpreadsheetController } from '../controllers/income_spreadsheet_controller.ts';
import { SnapshotInputController } from '../controllers/snapshot_input_controller.ts';
import { SpreadsheetController } from '../controllers/spreadsheet_controller.ts';
import { BottomNav } from './bottom_nav.ts';
import { Header } from './header.ts';
import { DataTable } from './data_table.ts';
import { IncomeInputForm } from './income_input_form.ts';
import { MainDashboard } from './main_dashboard.ts';
import { SnapshotInputForm } from './snapshot_input_form.ts';

export class App {
  private readonly repo: WealthRepository;

  constructor(repo: WealthRepository) {
    this.repo = repo;
  }

  render(root: HTMLElement): void {
    const repo = this.repo;
    const converter = FixedRateCurrencyConverter.create();
    const router = new Navigo(import.meta.env.BASE_URL);

    const header = new Header().render();
    const content = document.createElement('div');
    content.className = 'app-content';
    const nav = new BottomNav(
      () => router.navigate('/'),
      () => router.navigate('/snapshots'),
      () => router.navigate('/income'),
    );
    const navEl = nav.render();

    root.append(header, content, navEl);

    router
      .on('/', () => {
        content.innerHTML = '';
        if (repo.getAllBalanceSheets().length === 0) {
          router.navigate('/input');
          return;
        }
        content.append(
          new MainDashboard(
            new DashboardController(repo, converter),
            () => router.navigate('/input'),
            () => router.navigate('/income/input'),
          ).render(),
        );
        nav.setActive('dashboard');
      })
      .on('/snapshots', () => {
        content.innerHTML = '';
        const ctrl = new SpreadsheetController(repo, converter);
        content.append(
          new DataTable(ctrl.getColumns(), ctrl.getRows(), (id, i, amount) =>
            ctrl.updateCell(id, i, amount),
          ).render(),
        );
        nav.setActive('snapshots');
      })
      .on('/input', () => {
        content.innerHTML = '';
        content.append(
          new SnapshotInputForm(
            new SnapshotInputController(repo),
            () => router.navigate('/'),
            () => router.navigate('/'),
          ).render(),
        );
      })
      .on('/income', () => {
        content.innerHTML = '';
        const ctrl = new IncomeSpreadsheetController(repo, converter);
        content.append(
          new DataTable(ctrl.getColumns(), ctrl.getRows(), (id, i, amount) =>
            ctrl.updateCell(id, i, amount),
          ).render(),
        );
        nav.setActive('income');
      })
      .on('/income/input', () => {
        content.innerHTML = '';
        content.append(
          new IncomeInputForm(
            new IncomeInputController(repo),
            () => router.navigate('/income'),
            () => router.navigate('/income'),
          ).render(),
        );
      })
      .resolve();
  }
}
