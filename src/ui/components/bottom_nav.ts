type ActiveView = 'dashboard' | 'snapshots' | 'income';

export class BottomNav {
  private readonly onDashboard: () => void;
  private readonly onSnapshots: () => void;
  private readonly onIncome: () => void;

  private overviewBtn!: HTMLButtonElement;
  private historyBtn!: HTMLButtonElement;
  private incomeBtn!: HTMLButtonElement;

  constructor(onDashboard: () => void, onSnapshots: () => void, onIncome: () => void) {
    this.onDashboard = onDashboard;
    this.onSnapshots = onSnapshots;
    this.onIncome = onIncome;
  }

  render(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', 'Main navigation');

    this.overviewBtn = this.makeItem(
      'Overview',
      `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="11" width="5" height="9" rx="1.5" fill="currentColor" opacity=".5"/>
        <rect x="8.5" y="6" width="5" height="14" rx="1.5" fill="currentColor" opacity=".75"/>
        <rect x="15" y="2" width="5" height="18" rx="1.5" fill="currentColor"/>
      </svg>`,
    );
    this.historyBtn = this.makeItem(
      'Assets',
      `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 11L11 3A8 8 0 1 1 4.53 15.7Z" fill="currentColor"/>
        <path d="M11 11L4.53 15.7A8 8 0 0 1 11 3Z" fill="currentColor" opacity=".4"/>
      </svg>`,
    );
    this.incomeBtn = this.makeItem(
      'Income',
      `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <ellipse cx="11" cy="7.5" rx="7" ry="2.2" fill="currentColor"/>
        <path d="M4 7.5v3c0 1.22 3.13 2.2 7 2.2s7-.98 7-2.2v-3" fill="currentColor" opacity=".55"/>
        <path d="M4 10.5v3c0 1.22 3.13 2.2 7 2.2s7-.98 7-2.2v-3" fill="currentColor" opacity=".3"/>
        <ellipse cx="11" cy="13.5" rx="7" ry="2.2" fill="currentColor" opacity=".5"/>
      </svg>`,
    );

    this.overviewBtn.addEventListener('click', this.onDashboard);
    this.historyBtn.addEventListener('click', this.onSnapshots);
    this.incomeBtn.addEventListener('click', this.onIncome);

    nav.append(this.overviewBtn, this.historyBtn, this.incomeBtn);
    return nav;
  }

  setActive(view: ActiveView): void {
    this.overviewBtn.classList.toggle('bottom-nav__item--active', view === 'dashboard');
    this.historyBtn.classList.toggle('bottom-nav__item--active', view === 'snapshots');
    this.incomeBtn.classList.toggle('bottom-nav__item--active', view === 'income');
  }

  private makeItem(label: string, svgHtml: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bottom-nav__item';
    btn.innerHTML = `
      <span class="bottom-nav__icon">${svgHtml}</span>
      <span class="bottom-nav__label">${label}</span>
    `;
    return btn;
  }
}
