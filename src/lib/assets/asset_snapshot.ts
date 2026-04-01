import type { Money } from 'ts-money';
import type { Asset } from './asset.ts';

export interface AssetSnapshot {
  readonly asset: Asset;
  readonly value: Money;
}
