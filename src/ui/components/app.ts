import Navigo from 'navigo';
import type { WealthRepository } from '../../lib/data/wealth_repository.ts';
import { DashboardController } from '../controllers/dashboard_controller.ts';
import { SnapshotInputController } from '../controllers/snapshot_input_controller.ts';
import { SpreadsheetController } from '../controllers/spreadsheet_controller.ts';
import { BottomNav } from './bottom_nav.ts';
import { Header } from './header.ts';
import { MainDashboard } from './main_dashboard.ts';
import { SnapshotInputForm } from './snapshot_input_form.ts';
import { SnapshotsTable } from './snapshots_table.ts';

export class App {
  private readonly repo: WealthRepository;

  constructor(repo: WealthRepository) {
    this.repo = repo;
  }

  render(root: HTMLElement): void {
    const repo = this.repo;
    const router = new Navigo('/');

    const header = new Header().render();
    const content = document.createElement('div');
    content.className = 'app-content';
    const nav = new BottomNav(
      () => router.navigate('/'),
      () => router.navigate('/snapshots'),
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
          new MainDashboard(new DashboardController(repo), () =>
            router.navigate('/input'),
          ).render(),
        );
        nav.setActive('dashboard');
      })
      .on('/snapshots', () => {
        content.innerHTML = '';
        content.append(new SnapshotsTable(new SpreadsheetController(repo)).render());
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
      .resolve();
  }
}
