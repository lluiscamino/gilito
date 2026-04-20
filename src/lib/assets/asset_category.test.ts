import { describe, it, expect } from 'vitest';
import { Money, Currencies } from 'ts-money';
import {
  findCategoryById,
  isValidCategoryId,
  leafCategories,
  getSnapshotsPerCategoryLevel,
  AssetCategoryLevel,
} from './asset_category.ts';
import type { AssetCategoryId } from './asset_category_id.ts';
import type { BalanceSheet } from './balance_sheet.ts';

const EUR = Currencies.EUR;

describe('findCategoryById', () => {
  it('finds a top-level category', () => {
    expect(findCategoryById('defensive').name).toBe('Defensive');
    expect(findCategoryById('growth').name).toBe('Growth');
  });

  it('finds a mid-level category', () => {
    expect(findCategoryById('defensive.cash').name).toBe('Cash');
    expect(findCategoryById('growth.equities').name).toBe('Equities');
  });

  it('finds a leaf category', () => {
    expect(findCategoryById('defensive.cash.current').name).toBe('Current Account');
    expect(findCategoryById('defensive.cash.savings').name).toBe('Savings Account');
    expect(findCategoryById('growth.equities.pension').name).toBe('Pension');
    expect(findCategoryById('growth.equities.general').name).toBe('General Investments');
    expect(findCategoryById('growth.property').name).toBe('Property');
    expect(findCategoryById('growth.crypto').name).toBe('Crypto');
  });

  it('assigns the correct level to each category', () => {
    expect(findCategoryById('defensive').level).toBe(AssetCategoryLevel.Overview);
    expect(findCategoryById('growth').level).toBe(AssetCategoryLevel.Overview);
    expect(findCategoryById('defensive.cash').level).toBe(AssetCategoryLevel.Category);
    expect(findCategoryById('growth.equities').level).toBe(AssetCategoryLevel.Category);
    expect(findCategoryById('growth.property').level).toBe(AssetCategoryLevel.Category);
    expect(findCategoryById('growth.crypto').level).toBe(AssetCategoryLevel.Category);
    expect(findCategoryById('defensive.cash.current').level).toBe(AssetCategoryLevel.Detail);
    expect(findCategoryById('defensive.cash.savings').level).toBe(AssetCategoryLevel.Detail);
    expect(findCategoryById('growth.equities.pension').level).toBe(AssetCategoryLevel.Detail);
    expect(findCategoryById('growth.equities.general').level).toBe(AssetCategoryLevel.Detail);
  });
});

describe('isValidCategoryId', () => {
  it('returns true for known category ids', () => {
    expect(isValidCategoryId('defensive')).toBe(true);
    expect(isValidCategoryId('defensive.cash.savings')).toBe(true);
    expect(isValidCategoryId('growth.crypto')).toBe(true);
  });

  it('returns false for unknown ids', () => {
    expect(isValidCategoryId('unknown')).toBe(false);
    expect(isValidCategoryId('')).toBe(false);
    expect(isValidCategoryId('cash')).toBe(false);
  });
});

describe('leafCategories', () => {
  it('returns only leaf categories', () => {
    const leaves = leafCategories();
    expect(leaves.every((c) => c.children.length === 0)).toBe(true);
  });

  it('includes all expected leaves', () => {
    const ids = leafCategories().map((c) => c.id);
    expect(ids).toContain('defensive.cash.current');
    expect(ids).toContain('defensive.cash.savings');
    expect(ids).toContain('growth.equities.pension');
    expect(ids).toContain('growth.equities.general');
    expect(ids).toContain('growth.property');
    expect(ids).toContain('growth.crypto');
  });

  it('does not include internal nodes', () => {
    const ids = leafCategories().map((c) => c.id);
    expect(ids).not.toContain('defensive');
    expect(ids).not.toContain('growth');
    expect(ids).not.toContain('defensive.cash');
    expect(ids).not.toContain('growth.equities');
  });
});

describe('getSnapshotsPerCategoryLevel', () => {
  const makeSheet = (
    entries: { assetId: string; categoryId: AssetCategoryId }[],
  ): BalanceSheet => ({
    date: new Date('2024-01-01'),
    snapshots: entries.map(({ assetId, categoryId }) => ({
      asset: {
        id: assetId,
        name: assetId,
        category: findCategoryById(categoryId),
        currency: 'EUR',
      },
      value: new Money(100, EUR),
    })),
  });

  it('groups snapshots by Overview-level categories', () => {
    const sheet = makeSheet([
      { assetId: 'a1', categoryId: 'defensive.cash.current' },
      { assetId: 'a2', categoryId: 'growth.property' },
    ]);
    const result = getSnapshotsPerCategoryLevel(AssetCategoryLevel.Overview, sheet);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.category.id === 'defensive')?.snapshots).toHaveLength(1);
    expect(result.find((r) => r.category.id === 'growth')?.snapshots).toHaveLength(1);
  });

  it('groups snapshots by Category-level categories', () => {
    const sheet = makeSheet([
      { assetId: 'a1', categoryId: 'defensive.cash.current' },
      { assetId: 'a2', categoryId: 'defensive.cash.savings' },
      { assetId: 'a3', categoryId: 'growth.property' },
    ]);
    const result = getSnapshotsPerCategoryLevel(AssetCategoryLevel.Category, sheet);
    expect(result.find((r) => r.category.id === 'defensive.cash')?.snapshots).toHaveLength(2);
    expect(result.find((r) => r.category.id === 'growth.property')?.snapshots).toHaveLength(1);
  });

  it('groups snapshots by Detail-level categories', () => {
    const sheet = makeSheet([
      { assetId: 'a1', categoryId: 'defensive.cash.current' },
      { assetId: 'a2', categoryId: 'defensive.cash.current' },
      { assetId: 'a3', categoryId: 'defensive.cash.savings' },
    ]);
    const result = getSnapshotsPerCategoryLevel(AssetCategoryLevel.Detail, sheet);
    expect(result.find((r) => r.category.id === 'defensive.cash.current')?.snapshots).toHaveLength(
      2,
    );
    expect(result.find((r) => r.category.id === 'defensive.cash.savings')?.snapshots).toHaveLength(
      1,
    );
  });

  it('only returns categories at the requested level', () => {
    const sheet = makeSheet([{ assetId: 'a1', categoryId: 'defensive.cash.current' }]);
    const ids = getSnapshotsPerCategoryLevel(AssetCategoryLevel.Category, sheet).map(
      (r) => r.category.id,
    );
    expect(ids).not.toContain('defensive'); // Overview
    expect(ids).not.toContain('defensive.cash.current'); // Detail
  });

  it('collects all descendant snapshots under an Overview category', () => {
    const sheet = makeSheet([
      { assetId: 'a1', categoryId: 'defensive.cash.current' },
      { assetId: 'a2', categoryId: 'defensive.cash.savings' },
      { assetId: 'a3', categoryId: 'growth.equities.general' },
      { assetId: 'a4', categoryId: 'growth.property' },
    ]);
    const result = getSnapshotsPerCategoryLevel(AssetCategoryLevel.Overview, sheet);
    expect(result.find((r) => r.category.id === 'defensive')?.snapshots).toHaveLength(2);
    expect(result.find((r) => r.category.id === 'growth')?.snapshots).toHaveLength(2);
  });

  it('returns empty snapshots array for categories with no matching assets', () => {
    const sheet = makeSheet([{ assetId: 'a1', categoryId: 'defensive.cash.current' }]);
    const result = getSnapshotsPerCategoryLevel(AssetCategoryLevel.Category, sheet);
    expect(result.find((r) => r.category.id === 'growth.equities')?.snapshots).toHaveLength(0);
  });
});
