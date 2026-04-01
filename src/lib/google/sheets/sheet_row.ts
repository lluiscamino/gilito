export interface CellFormat {
  numberFormat?: { type: string; pattern: string };
}

interface Cell {
  value: string | number;
  format?: CellFormat;
}

export type SheetRow = Cell[];
