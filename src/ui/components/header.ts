export class Header {
  private readonly onSettings: () => void;

  constructor(onSettings: () => void) {
    this.onSettings = onSettings;
  }

  render(): HTMLElement {
    const header = document.createElement('header');

    const logo = document.createElement('span');
    logo.className = 'logo';
    logo.textContent = 'Gilito';
    header.append(logo);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'header__settings-btn';
    btn.setAttribute('aria-label', 'Settings');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clip-rule="evenodd"/>
    </svg>`;
    btn.addEventListener('click', this.onSettings);
    header.append(btn);

    return header;
  }
}
