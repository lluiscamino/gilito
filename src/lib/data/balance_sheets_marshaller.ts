import { toDecimal, fromDecimal } from '../fx/money.ts';
import type { Asset } from '../assets/asset.ts';
import type { BalanceSheet } from '../assets/balance_sheet.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

export class BalanceSheetsMarshaller {
  parse(rows: SheetRow[], assets: Asset[]): BalanceSheet[] {
    if (rows.length < 2) return [];
    const [header, ...dataRows] = rows;
    const assetIds = header.map((c) => c.value as string).slice(1);

    return dataRows.map((row) => {
      const [dateSerial, ...values] = row.map((c) => c.value as number);
      const snapshots = assetIds
        .map((id, i) => {
          const asset = assets.find((a) => a.id === id);
          const value = fromDecimal(values[i] ?? 0, asset?.currency ?? 'EUR');
          if (!asset || value.amount === 0) return null;
          return { asset, value };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);
      return { date: fromSheetsDate(dateSerial), snapshots };
    });
  }

  toSheetRows(balanceSheets: BalanceSheet[], assetIds: string[]): SheetRow[] {
    const header: SheetRow = ['Date', ...assetIds].map((s) => ({ value: s }));

    const dataRows: SheetRow[] = balanceSheets.map((balanceSheet) => [
      {
        value: toSheetsDate(balanceSheet.date),
        format: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } },
      },
      ...assetIds.map((id) => {
        const snapshot = balanceSheet.snapshots.find((s) => s.asset.id === id);
        const currency = snapshot?.asset.currency ?? 'EUR';
        return {
          value: snapshot ? toDecimal(snapshot.value) : 0,
          format: { numberFormat: { type: 'CURRENCY', pattern: currencyPattern(currency) } },
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

const CURRENCY_PATTERNS: Record<string, string> = {
  EUR: '€#,##0.00',
  USD: '$#,##0.00',
  GBP: '£#,##0.00',
};

function currencyPattern(currency: string): string {
  return CURRENCY_PATTERNS[currency] ?? '#,##0.00';
}
