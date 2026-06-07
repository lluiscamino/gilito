export class LoadingScreen {
  render(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'loading-screen';
    el.setAttribute('aria-busy', 'true');
    el.setAttribute('aria-label', 'Loading your data');

    const header = document.createElement('header');
    const logo = document.createElement('span');
    logo.className = 'logo';
    logo.textContent = 'Gilito';
    header.append(logo);

    const content = document.createElement('div');
    content.className = 'app-content';

    const main = document.createElement('main');
    main.append(renderHero(), renderActions(), renderChartCard(), renderBreakdownCard());
    content.append(main);

    el.append(header, content);
    return el;
  }
}

function renderHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'hero';
  hero.append(
    block('skeleton-hero__label'),
    block('skeleton-hero__amount'),
    block('skeleton-hero__delta'),
  );
  return hero;
}

function renderActions(): HTMLElement {
  const actions = document.createElement('div');
  actions.className = 'dashboard-actions';
  actions.append(block('skeleton-action'), block('skeleton-action'));
  return actions;
}

function renderChartCard(): HTMLElement {
  const card = document.createElement('section');
  card.className = 'card';
  card.append(block('skeleton-card__title'), block('skeleton-chart'));
  return card;
}

function renderBreakdownCard(): HTMLElement {
  const card = document.createElement('section');
  card.className = 'card';
  card.append(block('skeleton-card__title'));
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'skeleton-row';
    row.append(block('skeleton-row__label'), block('skeleton-row__bar'));
    card.append(row);
  }
  return card;
}

function block(className: string): HTMLElement {
  const div = document.createElement('div');
  div.className = `skeleton ${className}`;
  return div;
}
