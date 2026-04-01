import type { DashboardController } from '../controllers/dashboard_controller.ts';
import { NetWorthHero } from './net_worth_hero.ts';
import { WealthChart } from './wealth_chart.ts';
import { AssetBreakdown } from './asset_breakdown.ts';

export class MainDashboard {
  private readonly controller: DashboardController;
  private readonly onNewSnapshot: () => void;

  constructor(controller: DashboardController, onNewSnapshot: () => void) {
    this.controller = controller;
    this.onNewSnapshot = onNewSnapshot;
  }

  render(): HTMLElement {
    const main = document.createElement('main');

    const snapshotCard = document.createElement('button');
    snapshotCard.type = 'button';
    snapshotCard.className = 'new-snapshot-card';
    snapshotCard.innerHTML = `
      <span class="new-snapshot-card__icon">＋</span>
      <span class="new-snapshot-card__label">New Snapshot</span>
    `;
    snapshotCard.addEventListener('click', this.onNewSnapshot);

    main.append(
      new NetWorthHero(this.controller.getTotalCents(), this.controller.getDelta()).render(),
      snapshotCard,
      new WealthChart(this.controller.getWealthHistory()).render(),
      new AssetBreakdown(this.controller.getAllocations()).render(),
    );
    return main;
  }
}
