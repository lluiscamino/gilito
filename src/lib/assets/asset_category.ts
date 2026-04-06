import type { BalanceSheet } from './balance_sheet.ts';
import type { AssetSnapshot } from './asset_snapshot.ts';
import { AssetCategoryLevel } from './asset_category_level.ts';
import { type AssetCategoryId } from './asset_category_id.ts';
import { assertDefined } from '../utils/assert.ts';

export { AssetCategoryLevel };
export type { AssetCategoryId };

export interface AssetCategory {
  readonly id: AssetCategoryId;
  readonly name: string;
  readonly emoji: string;
  readonly color: string;
  readonly level: AssetCategoryLevel;
  readonly children: readonly AssetCategory[];
}

const ASSET_CATEGORIES: readonly AssetCategory[] = [
  {
    id: 'defensive',
    name: 'Defensive',
    emoji: '🛡️',
    color: '#2C7BE5',
    level: AssetCategoryLevel.Overview,
    children: [
      {
        id: 'defensive.cash',
        name: 'Cash',
        emoji: '💰',
        color: '#007AFF',
        level: AssetCategoryLevel.Category,
        children: [
          {
            id: 'defensive.cash.current',
            name: 'Current Account',
            emoji: '💳',
            color: '#5AC8FA',
            level: AssetCategoryLevel.Detail,
            children: [],
          },
          {
            id: 'defensive.cash.savings',
            name: 'Savings Account',
            emoji: '🏦',
            color: '#34AADC',
            level: AssetCategoryLevel.Detail,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    emoji: '🚀',
    color: '#5E5CE6',
    level: AssetCategoryLevel.Overview,
    children: [
      {
        id: 'growth.equities',
        name: 'Equities',
        emoji: '📈',
        color: '#5E5CE6',
        level: AssetCategoryLevel.Category,
        children: [
          {
            id: 'growth.equities.pension',
            name: 'Pension',
            emoji: '👴',
            color: '#AF52DE',
            level: AssetCategoryLevel.Detail,
            children: [],
          },
          {
            id: 'growth.equities.general',
            name: 'General Investments',
            emoji: '💼',
            color: '#7B68EE',
            level: AssetCategoryLevel.Detail,
            children: [],
          },
        ],
      },
      {
        id: 'growth.property',
        name: 'Property',
        emoji: '🏠',
        color: '#34C759',
        level: AssetCategoryLevel.Category,
        children: [],
      },
      {
        id: 'growth.crypto',
        name: 'Crypto',
        emoji: '🪙',
        color: '#F7931A',
        level: AssetCategoryLevel.Category,
        children: [],
      },
    ],
  },
];

function buildIndex(
  categories: readonly AssetCategory[],
  map: Map<AssetCategoryId, AssetCategory> = new Map(),
): Map<AssetCategoryId, AssetCategory> {
  for (const cat of categories) {
    map.set(cat.id, cat);
    buildIndex(cat.children, map);
  }
  return map;
}

const categoryIndex = buildIndex(ASSET_CATEGORIES);

export function isValidCategoryId(id: string): id is AssetCategoryId {
  return categoryIndex.has(id as AssetCategoryId);
}

export function findCategoryById(id: AssetCategoryId): AssetCategory {
  return assertDefined(categoryIndex.get(id), `Unknown category id: ${id}`);
}

export function leafCategories(): AssetCategory[] {
  return [...categoryIndex.values()].filter((cat) => cat.children.length === 0);
}

function isDescendantOf(category: AssetCategory, ancestor: AssetCategory): boolean {
  if (category.id === ancestor.id) return true;
  return ancestor.children.some((child) => isDescendantOf(category, child));
}

export function getSnapshotsPerCategoryLevel(
  level: AssetCategoryLevel,
  balanceSheet: BalanceSheet,
): { category: AssetCategory; snapshots: readonly AssetSnapshot[] }[] {
  const result: { category: AssetCategory; snapshots: readonly AssetSnapshot[] }[] = [];

  function visit(cat: AssetCategory): void {
    if (cat.level === level) {
      result.push({
        category: cat,
        snapshots: balanceSheet.snapshots.filter((s) => isDescendantOf(s.asset.category, cat)),
      });
    } else {
      for (const child of cat.children) visit(child);
    }
  }

  for (const cat of ASSET_CATEGORIES) visit(cat);
  return result;
}
