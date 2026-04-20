import type { Money } from 'ts-money';

export interface EntryInput {
  readonly id: string;
  readonly name: string;
  readonly lastValue: Money;
}
