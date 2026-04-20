import type { Money } from 'ts-money';

export interface WealthSnapshot {
  readonly date: Date;
  readonly total: Money;
}
