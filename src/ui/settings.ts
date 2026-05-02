import { isCurrency, Currency } from '../lib/fx/currency.ts';
import type { Currency as CurrencyType } from '../lib/fx/currency.ts';

const SETTINGS_KEY = 'gilito_settings';

export interface Settings {
  readonly displayCurrency: CurrencyType;
}

const DEFAULT_SETTINGS: Settings = { displayCurrency: Currency.EUR };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const displayCurrency =
      typeof parsed['displayCurrency'] === 'string' && isCurrency(parsed['displayCurrency'])
        ? parsed['displayCurrency']
        : DEFAULT_SETTINGS.displayCurrency;
    return { displayCurrency };
  } catch {
    console.warn('Could not load app settings');
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
