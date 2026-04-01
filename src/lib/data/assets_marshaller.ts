import { AssetCategory } from '../assets/asset_category.ts';
import type { Asset } from '../assets/asset.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

export class AssetsMarshaller {
  parse(rows: SheetRow[]): Asset[] {
    const assets: Asset[] = [];
    for (const row of rows.slice(1)) {
      const [id, name, category] = row.map((c) => c.value) as string[];
      if (id) assets.push({ id, name, category: category as AssetCategory });
    }
    return assets;
  }

  toSheetRows(assets: Asset[]): SheetRow[] {
    return [
      ['ID', 'Name', 'Category'].map((v) => ({ value: v })),
      ...assets.map((a) => [a.id, a.name, a.category].map((v) => ({ value: v }))),
    ];
  }
}
