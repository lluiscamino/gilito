import { describe, it, expect } from 'vitest';
import { assert, assertDefined } from './assert.ts';

describe('assert', () => {
  it('does not throw when the condition is true', () => {
    expect(() => assert(true, 'error')).not.toThrow();
  });

  it('throws with the provided message when the condition is false', () => {
    expect(() => assert(false, 'bad state')).toThrow('bad state');
  });
});

describe('assertDefined', () => {
  it('returns the value when it is defined', () => {
    expect(assertDefined('hello', 'err')).toBe('hello');
  });

  it('returns falsy-but-defined values without throwing', () => {
    expect(assertDefined(0, 'err')).toBe(0);
    expect(assertDefined(false, 'err')).toBe(false);
    expect(assertDefined('', 'err')).toBe('');
  });

  it('throws with the provided message when the value is null', () => {
    expect(() => assertDefined(null, 'was null')).toThrow('was null');
  });

  it('throws with the provided message when the value is undefined', () => {
    expect(() => assertDefined(undefined, 'was undefined')).toThrow('was undefined');
  });
});
