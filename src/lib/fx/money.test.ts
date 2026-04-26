import { describe, it, expect } from 'vitest';
import { Money } from 'ts-money';
import { fromDecimal, toDecimal } from './money.ts';

describe('fromDecimal', () => {
  it('converts a decimal amount to cents', () => {
    expect(fromDecimal(10.5, 'EUR')).toEqual(new Money(1050, 'EUR'));
  });

  it('rounds to the nearest cent', () => {
    expect(fromDecimal(10.005, 'EUR').amount).toBe(1001);
    expect(fromDecimal(10.004, 'EUR').amount).toBe(1000);
  });

  it('handles zero', () => {
    expect(fromDecimal(0, 'EUR')).toEqual(new Money(0, 'EUR'));
  });

  it('preserves the currency', () => {
    expect(fromDecimal(5, 'USD').currency).toBe('USD');
    expect(fromDecimal(5, 'GBP').currency).toBe('GBP');
  });

  it('is the inverse of toDecimal', () => {
    const original = new Money(1234, 'EUR');
    expect(fromDecimal(toDecimal(original), 'EUR')).toEqual(original);
  });
});
