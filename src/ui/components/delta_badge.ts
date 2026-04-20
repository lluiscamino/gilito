import { Money } from 'ts-money';
import { formatMoney } from '../formatting.ts';

export class DeltaBadge {
  private readonly value: number;
  private readonly formatter: (abs: number) => string;

  constructor(value: number, formatter: (abs: number) => string) {
    this.value = value;
    this.formatter = formatter;
  }

  render(): HTMLElement {
    const positive = this.value >= 0;
    const el = document.createElement('span');
    el.className = `delta ${positive ? 'delta--positive' : 'delta--negative'}`;
    el.textContent = `${positive ? '+' : '-'}${this.formatter(Math.abs(this.value))}`;
    return el;
  }
}

export class MoneyDeltaBadge extends DeltaBadge {
  constructor(money: Money) {
    super(money.amount, (n) => formatMoney(new Money(n, money.currency)));
  }
}

export class PercentDeltaBadge extends DeltaBadge {
  constructor(pct: number) {
    super(pct, (n) => `${n.toFixed(2)}%`);
  }
}
