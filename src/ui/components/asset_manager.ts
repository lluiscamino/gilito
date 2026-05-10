import type { Asset } from '../../lib/assets/asset.ts';
import type { AssetCategory } from '../../lib/assets/asset_category.ts';
import { SUPPORTED_CURRENCIES } from '../../lib/fx/currency.ts';
import type { Currency } from '../../lib/fx/currency.ts';

export class AssetManager {
  private readonly assets: readonly Asset[];
  private readonly categories: readonly AssetCategory[];
  private readonly onUpdate: (assetId: string, categoryId: string, currency: Currency) => void;

  constructor(
    assets: readonly Asset[],
    categories: readonly AssetCategory[],
    onUpdate: (assetId: string, categoryId: string, currency: Currency) => void,
  ) {
    this.assets = assets;
    this.categories = categories;
    this.onUpdate = onUpdate;
  }

  render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'asset-manager card';

    const title = document.createElement('h2');
    title.className = 'asset-manager__title';
    title.textContent = 'Manage Assets';

    const list = document.createElement('ul');
    list.className = 'asset-manager__list';

    for (const asset of this.assets) {
      list.append(this.makeRow(asset));
    }

    section.append(title, list);
    return section;
  }

  private makeRow(asset: Asset): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'asset-manager__row';

    const name = document.createElement('span');
    name.className = 'asset-manager__name';
    name.textContent = asset.name;

    const categorySelect = document.createElement('select');
    categorySelect.className = 'asset-manager__select';
    categorySelect.setAttribute('aria-label', `Category for ${asset.name}`);
    for (const cat of this.categories) {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      if (cat.id === asset.category.id) option.selected = true;
      categorySelect.append(option);
    }

    const currencySelect = document.createElement('select');
    currencySelect.className = 'asset-manager__select';
    currencySelect.setAttribute('aria-label', `Currency for ${asset.name}`);
    for (const currency of SUPPORTED_CURRENCIES) {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      if (currency === asset.currency) option.selected = true;
      currencySelect.append(option);
    }

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'asset-manager__save btn-secondary';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      this.onUpdate(asset.id, categorySelect.value, currencySelect.value as Currency);
    });

    li.append(name, categorySelect, currencySelect, saveBtn);
    return li;
  }
}
