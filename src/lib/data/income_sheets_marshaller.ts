import { Money, Currencies } from 'ts-money';
import type { IncomeSource } from '../income/income_source.ts';
import type { IncomeSheet } from '../income/income_sheet.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

export class IncomeSheetsMarshaller {
  parse(rows: SheetRow[], sources: IncomeSource[]): IncomeSheet[] {
    if (rows.length < 2) return [];
    const [header, ...dataRows] = rows;
    const sourceIds = header.map((c) => c.value as string).slice(1);

    return dataRows.map((row) => {
      const [dateSerial, ...values] = row.map((c) => c.value as number);
      const entries = sourceIds
        .map((id, i) => {
          const source = sources.find((s) => s.id === id);
          const cents = Math.round((values[i] ?? 0) * 100);
          if (!source || cents === 0) return null;
          return { source, amount: new Money(cents, Currencies.EUR) };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);
      return { date: fromSheetsDate(dateSerial), entries };
    });
  }

  toSheetRows(sheets: IncomeSheet[], sourceIds: string[]): SheetRow[] {
    const header: SheetRow = ['Date', ...sourceIds].map((s) => ({ value: s }));
    const dataRows: SheetRow[] = sheets.map((sheet) => [
      {
        value: toSheetsDate(sheet.date),
        format: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } },
      },
      ...sourceIds.map((id) => {
        const entry = sheet.entries.find((e) => e.source.id === id);
        return {
          value: entry ? entry.amount.amount / 100 : 0,
          format: { numberFormat: { type: 'CURRENCY', pattern: '€#,##0.00' } },
        };
      }),
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
