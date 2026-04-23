import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Money, Currencies } from 'ts-money';
import type { IncomeSheet } from '../../lib/income/income_sheet.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import type { IncomeChartData } from '../controllers/income_chart_controller.ts';
import { IncomeChartController } from '../controllers/income_chart_controller.ts';
import { formatMoney, formatMoneyCompact } from '../formatting.ts';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PALETTE = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#AF52DE',
  '#FF3B30',
  '#5AC8FA',
  '#FF2D55',
  '#FFCC00',
];

type Period = 'month' | 'year';

export class IncomeChart {
  private readonly ctrl: IncomeChartController;

  constructor(sheets: IncomeSheet[], converter: CurrencyConverter) {
    this.ctrl = new IncomeChartController(sheets, converter);
  }

  render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'card';
    section.setAttribute('aria-label', 'Income by source');

    const canvas = document.createElement('canvas');
    const chartWrap = document.createElement('div');
    chartWrap.className = 'chart-wrap--bar';
    chartWrap.append(canvas);

    let period: Period = 'month';
    const chart = buildChart(canvas, this.ctrl.getMonthlyData());

    const { header, monthBtn, yearBtn } = buildHeader();

    const onPeriodChange = (selected: Period) => {
      period = selected;
      monthBtn.classList.toggle('level-picker__btn--active', period === 'month');
      yearBtn.classList.toggle('level-picker__btn--active', period === 'year');
      const data = period === 'month' ? this.ctrl.getMonthlyData() : this.ctrl.getYearlyData();
      chart.data.labels = data.labels;
      chart.data.datasets = toChartDatasets(data);
      chart.update();
    };

    monthBtn.addEventListener('click', () => onPeriodChange('month'));
    yearBtn.addEventListener('click', () => onPeriodChange('year'));

    section.append(header, chartWrap);
    return section;
  }
}

function buildHeader(): {
  header: HTMLElement;
  monthBtn: HTMLButtonElement;
  yearBtn: HTMLButtonElement;
} {
  const monthBtn = buildPeriodButton('Monthly', true);
  const yearBtn = buildPeriodButton('Yearly', false);

  const picker = document.createElement('div');
  picker.className = 'level-picker income-chart__picker';
  picker.append(monthBtn, yearBtn);

  const title = document.createElement('h2');
  title.className = 'card__title';
  title.style.marginBottom = '0';
  title.textContent = 'Income by Source';

  const header = document.createElement('div');
  header.className = 'income-chart__header';
  header.append(title, picker);

  return { header, monthBtn, yearBtn };
}

function buildPeriodButton(label: string, active: boolean): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'level-picker__btn' + (active ? ' level-picker__btn--active' : '');
  btn.textContent = label;
  return btn;
}

function buildChart(canvas: HTMLCanvasElement, initialData: IncomeChartData): Chart {
  return new Chart(canvas, {
    type: 'bar',
    data: { labels: initialData.labels, datasets: toChartDatasets(initialData) },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            borderRadius: 3,
            useBorderRadius: true,
            padding: 16,
            font: { size: 11 },
            color: '#6E6E73',
          },
        },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#1D1D1F',
          bodyColor: '#6E6E73',
          borderColor: 'rgba(0,0,0,0.08)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => {
              const v = ctx.raw as number;
              return `  ${ctx.dataset.label}: ${formatMoney(new Money(Math.round(v * 100), Currencies.EUR))}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          border: { display: false },
          ticks: { maxRotation: 0 },
        },
        y: {
          stacked: true,
          grid: { color: 'rgba(0, 0, 0, 0.04)' },
          border: { display: false },
          ticks: {
            callback: (v) =>
              formatMoneyCompact(new Money(Math.round((v as number) * 100), Currencies.EUR)),
          },
        },
      },
    },
  });
}

function toChartDatasets(data: IncomeChartData) {
  return data.datasets.map(({ source, values }, i) => ({
    label: source.name,
    data: values,
    backgroundColor: PALETTE[i % PALETTE.length],
    borderRadius: 3,
    borderSkipped: false,
  }));
}
