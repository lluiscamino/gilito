import type { Money } from 'ts-money';

export interface WealthDelta {
  readonly delta: Money;
  readonly percentage: number;
}
