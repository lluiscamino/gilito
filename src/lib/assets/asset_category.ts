export const AssetCategory = {
  CASH: 'CASH',
  STOCKS: 'STOCKS',
  PROPERTY: 'PROPERTY',
  CRYPTO: 'CRYPTO',
} as const;

export type AssetCategory = (typeof AssetCategory)[keyof typeof AssetCategory];
