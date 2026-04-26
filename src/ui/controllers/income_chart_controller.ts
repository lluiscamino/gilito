import type { IncomeSheet } from '../../lib/income/income_sheet.ts';
import type { CurrencyConverter } from '../../lib/fx/currency_converter.ts';
import { toDecimal } from '../../lib/fx/money.ts';
import { formatMoneyCompact } from '../formatting.ts';
import { Money, Currencies } from 'ts-money';

export interface ValueSource {
  label: string;
  color: string;
}

export interface Entry {
  topLabel?: string;
  bottomLabel: string;
  values: Map<ValueSource, number>;
}

export class IncomeChartData {
  readonly entries: Entry[];

  constructor(entries: Entry[]) {
    this.entries = entries;
  }

  sources(): ValueSource[] {
    const seen = new Set<ValueSource>();
    for (const entry of this.entries) {
      for (const source of entry.values.keys()) {
        seen.add(source);
      }
    }
    return [...seen];
  }
}

const PALETTE = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#5AC8FA', '#FF2D55', '#FFCC00'];

const TAX_PAID_SOURCE: ValueSource = { label: 'Tax Paid', color: '#FF3B30' };

export class IncomeChartController {
  private readonly sheets: IncomeSheet[];
  private readonly converter: CurrencyConverter;

  constructor(sheets: IncomeSheet[], converter: CurrencyConverter) {
    this.sheets = sheets;
    this.converter = converter;
  }

  getMonthlyData(): IncomeChartData {
    return this.buildData(
      (date) => ({
        key: date.getFullYear() * 100 + date.getMonth(),
        label: date.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      }),
      /* showTopLabel = */ false,
    );
  }

  getYearlyData(): IncomeChartData {
    return this.buildData(
      (date) => ({ key: date.getFullYear(), label: String(date.getFullYear()) }),
      /* showTopLabel = */ true,
    );
  }

  private buildData(
    bucket: (date: Date) => { key: number; label: string },
    showTopLabel: boolean,
  ): IncomeChartData {
    const sourceMap = new Map<string, ValueSource>();
    const entries = this.groupByBucket(bucket).map(({ label, sheets }) => {
      const values = this.aggregateValues(sheets, sourceMap);
      const topLabel = showTopLabel ? this.computeNetLabel(values) : undefined;
      return { topLabel, bottomLabel: label, values };
    });
    return new IncomeChartData(entries);
  }

  private groupByBucket(
    bucket: (date: Date) => { key: number; label: string },
  ): { label: string; sheets: IncomeSheet[] }[] {
    const byBucket = new Map<number, { label: string; sheets: IncomeSheet[] }>();
    for (const sheet of this.sheets) {
      const { key, label } = bucket(sheet.date);
      if (!byBucket.has(key)) byBucket.set(key, { label, sheets: [] });
      byBucket.get(key)!.sheets.push(sheet);
    }
    return [...byBucket.entries()].sort(([a], [b]) => a - b).map(([, group]) => group);
  }

  private aggregateValues(
    sheets: IncomeSheet[],
    sourceMap: Map<string, ValueSource>,
  ): Map<ValueSource, number> {
    const values = new Map<ValueSource, number>();
    for (const sheet of sheets) {
      for (const entry of sheet.entries) {
        const valueSource = this.getOrCreateValueSource(
          sourceMap,
          entry.source.id,
          entry.source.name,
        );
        values.set(
          valueSource,
          (values.get(valueSource) ?? 0) +
            toDecimal(this.converter.toDisplayCurrency(entry.amount)),
        );
      }
    }
    const taxPaid = sheets.reduce((sum, sheet) => sum + toDecimal(sheet.taxPaid), 0);
    values.set(TAX_PAID_SOURCE, -taxPaid);
    return values;
  }

  private computeNetLabel(values: Map<ValueSource, number>): string {
    const net = [...values.values()].reduce((sum, v) => sum + v, 0);
    return formatMoneyCompact(new Money(Math.round(net * 100), Currencies.EUR));
  }

  private getOrCreateValueSource(
    map: Map<string, ValueSource>,
    id: string,
    name: string,
  ): ValueSource {
    let valueSource = map.get(id);
    if (!valueSource) {
      valueSource = { label: name, color: PALETTE[map.size % PALETTE.length] };
      map.set(id, valueSource);
    }
    return valueSource;
  }
}
