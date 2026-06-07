import Navigo from 'navigo';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import { DashboardController } from '../controllers/dashboard_controller.ts';
import { IncomeInputController } from '../controllers/income_input_controller.ts';
import { SnapshotInputController } from '../controllers/snapshot_input_controller.ts';
import { SpreadsheetController } from '../controllers/spreadsheet_controller.ts';
import { loadSettings, saveSettings } from '../settings.ts';
import { BottomNav } from './bottom_nav.ts';
import { Header } from './header.ts';
import { DataTable } from './data_table.ts';
import { IncomeInputForm } from './income_input_form.ts';
import { IncomePage } from './income_page.ts';
import { MainDashboard } from './main_dashboard.ts';
import { SettingsPage } from './settings_page.ts';
import { SnapshotInputForm } from './snapshot_input_form.ts';

export class App {
  private readonly repo: WealthRepository;
  private readonly converter: CurrencyConverter;

  constructor(repo: WealthRepository, converter: CurrencyConverter) {
    this.repo = repo;
    this.converter = converter;
  }

  render(root: HTMLElement): void {
    const repo = this.repo;
    const converter = this.converter;
    const router = new Navigo(import.meta.env.BASE_URL);

    const content = document.createElement('div');
    content.className = 'app-content';
    const nav = new BottomNav(
      () => router.navigate('/'),
      () => router.navigate('/snapshots'),
      () => router.navigate('/income'),
    );
    const navEl = nav.render();

    const header = new Header(() => router.navigate('/settings')).render();
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
            new DashboardController(repo, converter, loadSettings().displayCurrency),
            () => router.navigate('/input'),
            () => router.navigate('/income/input'),
          ).render(),
        );
        nav.setActive('dashboard');
      })
      .on('/snapshots', () => {
        content.innerHTML = '';
        const ctrl = new SpreadsheetController(repo, converter, loadSettings().displayCurrency);
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
        content.append(new IncomePage(repo, converter, loadSettings().displayCurrency).render());
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
      .on('/settings', () => {
        content.innerHTML = '';
        content.append(
          new SettingsPage(
            loadSettings(),
            repo.getSpreadsheetUrl(),
            (newSettings) => {
              saveSettings(newSettings);
              router.navigate('/');
            },
            () => router.navigate('/'),
          ).render(),
        );
      })
      .resolve();
  }
}
