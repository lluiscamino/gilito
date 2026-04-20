import { findCategoryById, isValidCategoryId } from '../assets/asset_category.ts';
import type { Asset } from '../assets/asset.ts';
import { isCurrency } from '../fx/currency.ts';
import type { SheetRow } from '../google/sheets/sheet_row.ts';

export class AssetsMarshaller {
  parse(rows: SheetRow[]): Asset[] {
    const assets: Asset[] = [];
    for (const row of rows.slice(1)) {
      const [id, name, categoryId, currency] = row.map((c) => c.value) as string[];
      if (!id) continue;
      if (!isValidCategoryId(categoryId)) continue;
      if (!isCurrency(currency)) continue;
      const category = findCategoryById(categoryId);
      assets.push({ id, name, category, currency });
    }
    return assets;
  }

  toSheetRows(assets: Asset[]): SheetRow[] {
    return [
      ['ID', 'Name', 'Category', 'Currency'].map((v) => ({ value: v })),
      ...assets.map((a) => [a.id, a.name, a.category.id, a.currency].map((v) => ({ value: v }))),
    ];
  }
}
