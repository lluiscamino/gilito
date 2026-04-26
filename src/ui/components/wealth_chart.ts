import {
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import type { WealthSnapshot } from '../controllers/wealth_snapshot.ts';
import { Currency } from '../../lib/fx/currency.ts';
import { formatMoney, formatMoneyCompact, toDecimal, fromDecimal } from '../formatting.ts';

Chart.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

export class WealthChart {
  private readonly history: WealthSnapshot[];

  constructor(history: WealthSnapshot[]) {
    this.history = history;
  }

  render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'card';
    section.setAttribute('aria-label', 'Wealth over time');
    section.innerHTML = `
      <h2 class="card__title">Wealth Over Time</h2>
      <div class="chart-wrap--line"></div>
    `;

    const canvas = document.createElement('canvas');
    section.querySelector('.chart-wrap--line')!.append(canvas);

    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 122, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 122, 255, 0)');

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.history.map((s) =>
          s.date.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        ),
        datasets: [
          {
            data: this.history.map((s) => toDecimal(s.total)),
            borderColor: '#007AFF',
            borderWidth: 2,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#007AFF',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#007AFF',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#1D1D1F',
            bodyColor: '#6E6E73',
            borderColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => `  ${formatMoney(fromDecimal(ctx.raw as number, Currency.EUR))}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { maxRotation: 0 },
          },
          y: {
            grid: { color: 'rgba(0, 0, 0, 0.04)' },
            border: { display: false },
            ticks: {
              callback: (v) => formatMoneyCompact(fromDecimal(v as number, Currency.EUR)),
            },
          },
        },
      },
    });

    return section;
  }
}
