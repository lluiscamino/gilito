export type ActiveView = 'dashboard' | 'snapshots';

export class BottomNav {
  private readonly onDashboard: () => void;
  private readonly onSnapshots: () => void;

  private overviewBtn!: HTMLButtonElement;
  private historyBtn!: HTMLButtonElement;

  constructor(onDashboard: () => void, onSnapshots: () => void) {
    this.onDashboard = onDashboard;
    this.onSnapshots = onSnapshots;
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
      'History',
      `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="4" width="18" height="2.5" rx="1.25" fill="currentColor"/>
        <rect x="2" y="9.75" width="18" height="2.5" rx="1.25" fill="currentColor" opacity=".75"/>
        <rect x="2" y="15.5" width="12" height="2.5" rx="1.25" fill="currentColor" opacity=".5"/>
      </svg>`,
    );

    this.overviewBtn.addEventListener('click', this.onDashboard);
    this.historyBtn.addEventListener('click', this.onSnapshots);

    nav.append(this.overviewBtn, this.historyBtn);
    return nav;
  }

  setActive(view: ActiveView): void {
    this.overviewBtn.classList.toggle('bottom-nav__item--active', view === 'dashboard');
    this.historyBtn.classList.toggle('bottom-nav__item--active', view === 'snapshots');
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
