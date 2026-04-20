import type { Money } from 'ts-money';
import type { IncomeSource } from './income_source.ts';

export interface IncomeEntry {
  readonly source: IncomeSource;
  readonly amount: Money;
}
