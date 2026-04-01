import type { Asset } from './asset.ts';
import type { AssetSnapshot } from './asset_snapshot.ts';

export interface BalanceSheet {
  readonly date: Date;
  readonly snapshots: readonly AssetSnapshot[];
}

export function collectAssets(balanceSheets: BalanceSheet[]): Asset[] {
  const seen = new Set<string>();
  const assets: Asset[] = [];
  for (const balanceSheet of balanceSheets) {
    for (const snapshot of balanceSheet.snapshots) {
      if (!seen.has(snapshot.asset.id)) {
        seen.add(snapshot.asset.id);
        assets.push(snapshot.asset);
      }
    }
  }
  return assets;
}
