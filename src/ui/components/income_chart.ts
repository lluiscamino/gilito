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

type Period = 'month' | 'year';

export class IncomeChart {
  private readonly ctrl: IncomeChartController;
  private period: Period = 'month';

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

    const chart = this.buildChart(canvas);

    const { header, monthBtn, yearBtn } = buildHeader();

    const onPeriodChange = (selected: Period) => {
      this.period = selected;
      const data = this.getData();
      monthBtn.classList.toggle('level-picker__btn--active', this.period === 'month');
      yearBtn.classList.toggle('level-picker__btn--active', this.period === 'year');
      chart.data.labels = data.entries.map((e) => e.bottomLabel);
      chart.data.datasets = toChartDatasets(data);
      chart.update();
    };

    monthBtn.addEventListener('click', () => onPeriodChange('month'));
    yearBtn.addEventListener('click', () => onPeriodChange('year'));

    section.append(header, chartWrap);
    return section;
  }

  private buildChart(canvas: HTMLCanvasElement): Chart {
    const data = this.getData();
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.entries.map((e) => e.bottomLabel),
        datasets: toChartDatasets(data),
      },
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
          xTop: {
            type: 'category',
            position: 'top',
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#1D1D1F',
              font: { size: 11, weight: 600 },
              callback: (_, i) => this.getData().entries[i]?.topLabel,
            },
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

  private getData(): IncomeChartData {
    return this.period === 'month' ? this.ctrl.getMonthlyData() : this.ctrl.getYearlyData();
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

function toChartDatasets(data: IncomeChartData) {
  return data.sources().map((source) => ({
    label: source.label,
    data: data.entries.map((entry) => entry.values.get(source) ?? 0),
    backgroundColor: source.color,
    borderRadius: 3,
    borderSkipped: false,
  }));
}
