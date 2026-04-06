export const AssetCategoryLevel = {
  Overview: { id: 'overview', order: 0, name: 'Overview' },
  Category: { id: 'category', order: 1, name: 'Category' },
  Detail: { id: 'detail', order: 2, name: 'Detail' },
} as const;

export type AssetCategoryLevel = (typeof AssetCategoryLevel)[keyof typeof AssetCategoryLevel];
