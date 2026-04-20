import type { Money } from 'ts-money';
import type { WealthDelta } from '../controllers/wealth_delta.ts';
import { formatMoney } from '../formatting.ts';
import { MoneyDeltaBadge, PercentDeltaBadge } from './delta_badge.ts';

export class NetWorthHero {
  private readonly total: Money;
  private readonly delta: WealthDelta | null;

  constructor(total: Money, delta: WealthDelta | null) {
    this.total = total;
    this.delta = delta;
  }

  render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'hero';
    section.setAttribute('aria-label', 'Total net worth');

    const label = document.createElement('p');
    label.className = 'hero__label';
    label.textContent = 'Total Net Worth';

    const amount = document.createElement('p');
    amount.className = 'hero__amount';
    amount.textContent = formatMoney(this.total);

    section.append(label, amount);
    if (this.delta) section.append(this.renderDelta(this.delta));
    return section;
  }

  private renderDelta(delta: WealthDelta): HTMLElement {
    const p = document.createElement('p');
    p.className = 'hero__delta';

    const sep = document.createElement('span');
    sep.className = 'hero__delta-sep';
    sep.textContent = '·';

    const since = document.createElement('span');
    since.className = 'hero__delta-label';
    since.textContent = 'since last snapshot';

    p.append(
      new MoneyDeltaBadge(delta.delta).render(),
      sep,
      new PercentDeltaBadge(delta.percentage).render(),
      since,
    );
    return p;
  }
}
