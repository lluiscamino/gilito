import type { IncomeSheet } from '../../lib/income/income_sheet.ts';
import { collectSources } from '../../lib/income/income_sheet.ts';
import type { IncomeSource } from '../../lib/income/income_source.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import { sumInDisplayCurrency, toDecimal } from '../../lib/fx/money.ts';

export interface SourceDataset {
  source: IncomeSource;
  values: number[];
}

export interface IncomeChartData {
  labels: string[];
  datasets: SourceDataset[];
}

export class IncomeChartController {
  private readonly sheets: IncomeSheet[];
  private readonly converter: CurrencyConverter;

  constructor(sheets: IncomeSheet[], converter: CurrencyConverter) {
    this.sheets = sheets;
    this.converter = converter;
  }

  getMonthlyData(): IncomeChartData {
    const sources = collectSources(this.sheets);
    const sorted = [...this.sheets].sort((a, b) => a.date.getTime() - b.date.getTime());
    const labels = sorted.map((s) =>
      s.date.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
    );
    const datasets = sources.map((source) => ({
      source,
      values: sorted.map((sheet) => {
        const entry = sheet.entries.find((e) => e.source.id === source.id);
        if (!entry) return 0;
        return toDecimal(this.converter.toDisplayCurrency(entry.amount));
      }),
    }));
    return { labels, datasets };
  }

  getYearlyData(): IncomeChartData {
    const sources = collectSources(this.sheets);
    const byYear = new Map<number, IncomeSheet[]>();
    for (const sheet of this.sheets) {
      const year = sheet.date.getFullYear();
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year)!.push(sheet);
    }
    const years = [...byYear.keys()].sort((a, b) => a - b);
    const labels = years.map(String);
    const datasets = sources.map((source) => ({
      source,
      values: years.map((year) => {
        const amounts = byYear
          .get(year)!
          .flatMap((sheet) => sheet.entries.filter((e) => e.source.id === source.id))
          .map((e) => e.amount);
        if (amounts.length === 0) return 0;
        return toDecimal(sumInDisplayCurrency(amounts, this.converter));
      }),
    }));
    return { labels, datasets };
  }
}
