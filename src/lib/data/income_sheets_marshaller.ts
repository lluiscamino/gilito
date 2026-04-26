import { toDecimal, fromDecimal } from '../fx/money.ts';
import type { IncomeSource } from '../income/income_source.ts';
import type { IncomeSheet } from '../income/income_sheet.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

const TAX_PAID_HEADER = 'TaxPaid';

export class IncomeSheetsMarshaller {
  parse(rows: SheetRow[], sources: IncomeSource[]): IncomeSheet[] {
    if (rows.length < 2) return [];
    const [header, ...dataRows] = rows;
    const allHeaders = header.map((c) => c.value as string).slice(1);
    const taxPaidIndex = allHeaders.indexOf(TAX_PAID_HEADER);
    const sourceIds = allHeaders.filter((id) => id !== TAX_PAID_HEADER);

    return dataRows.map((row) => {
      const [dateSerial, ...values] = row.map((c) => c.value as number);
      const entries = sourceIds
        .map((id, i) => {
          const source = sources.find((s) => s.id === id);
          const amount = fromDecimal(values[i] ?? 0, source?.currency ?? 'EUR');
          if (!source || amount.amount === 0) return null;
          return { source, amount };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);
      const taxPaid = fromDecimal(taxPaidIndex >= 0 ? (values[taxPaidIndex] ?? 0) : 0, 'EUR');
      return { date: fromSheetsDate(dateSerial), entries, taxPaid };
    });
  }

  toSheetRows(sheets: IncomeSheet[], sourceIds: string[]): SheetRow[] {
    const header: SheetRow = ['Date', ...sourceIds, TAX_PAID_HEADER].map((s) => ({ value: s }));
    const dataRows: SheetRow[] = sheets.map((sheet) => [
      {
        value: toSheetsDate(sheet.date),
        format: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } },
      },
      ...sourceIds.map((id) => {
        const entry = sheet.entries.find((e) => e.source.id === id);
        const currency = entry?.source.currency ?? 'EUR';
        return {
          value: entry ? toDecimal(entry.amount) : 0,
          format: { numberFormat: { type: 'CURRENCY', pattern: currencyPattern(currency) } },
        };
      }),
      {
        value: toDecimal(sheet.taxPaid),
        format: { numberFormat: { type: 'CURRENCY', pattern: currencyPattern('EUR') } },
      },
    ]);
    return [header, ...dataRows];
  }
}

function toSheetsDate(date: Date): number {
  return date.getTime() / 86400000 + 25569;
}

function fromSheetsDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400000));
}

const CURRENCY_PATTERNS: Record<string, string> = {
  EUR: '€#,##0.00',
  USD: '$#,##0.00',
  GBP: '£#,##0.00',
};

function currencyPattern(currency: string): string {
  return CURRENCY_PATTERNS[currency] ?? '#,##0.00';
}
