export interface SpreadsheetRow {
  readonly assetId: string;
  readonly assetName: string;
  readonly values: readonly number[]; // cents, one per date (same order as SpreadsheetController.getDates())
}
