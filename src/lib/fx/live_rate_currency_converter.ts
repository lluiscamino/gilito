import { Money } from 'ts-money';
import { Currency } from './currency.ts';
import type { CurrencyConverter } from './currency_converter.ts';

const CACHE_KEY = 'fx_rates_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const FALLBACK_RATES: Partial<Record<Currency, number>> = {
  [Currency.USD]: 0.85,
  [Currency.GBP]: 1.15,
};

interface RatesCache {
  timestamp: number;
  rates: Record<string, number>;
}

export class LiveRateCurrencyConverter implements CurrencyConverter {
  private readonly eurRates: ReadonlyMap<Currency, number>;

  private constructor(eurRates: Partial<Record<Currency, number>>) {
    this.eurRates = new Map(Object.entries(eurRates) as [Currency, number][]);
  }

  toCurrency(money: Money, currency: Currency): Money {
    if (money.currency === currency) return money;
    const eurCents = this.toEurCents(money);
    return this.eurCentsToCurrency(eurCents, currency);
  }

  static async create(): Promise<LiveRateCurrencyConverter> {
    const cached = loadCache();
    if (cached) return new LiveRateCurrencyConverter(cached);

    try {
      const rates = await fetchRates();
      saveCache(rates);
      return new LiveRateCurrencyConverter(rates);
    } catch (e) {
      console.error('Failed to fetch FX rates, using fallback:', e);
      return new LiveRateCurrencyConverter(FALLBACK_RATES);
    }
  }

  private toEurCents(money: Money): number {
    if (money.currency === Currency.EUR) return money.amount;
    const rate = this.eurRates.get(money.currency as Currency);
    if (rate === undefined) throw new Error(`No EUR rate for currency: ${money.currency}`);
    return Math.round(money.amount * rate);
  }

  private eurCentsToCurrency(eurCents: number, currency: Currency): Money {
    if (currency === Currency.EUR) return new Money(eurCents, Currency.EUR);
    const rate = this.eurRates.get(currency);
    if (rate === undefined) throw new Error(`No EUR rate for currency: ${currency}`);
    return new Money(Math.round(eurCents / rate), currency);
  }
}

function loadCache(): Partial<Record<Currency, number>> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as RatesCache;
    if (Date.now() - cache.timestamp > CACHE_TTL_MS) return null;
    return cache.rates as Partial<Record<Currency, number>>;
  } catch {
    return null;
  }
}

function saveCache(rates: Partial<Record<Currency, number>>): void {
  try {
    const cache: RatesCache = { timestamp: Date.now(), rates };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage unavailable; no-op
  }
}

async function fetchRates(): Promise<Partial<Record<Currency, number>>> {
  const res = await fetch('https://api.frankfurter.dev/v1/latest?from=EUR');
  if (!res.ok) throw new Error(`FX API error: ${res.status}`);
  const data = (await res.json()) as { rates: Record<string, number> };
  const rates: Partial<Record<Currency, number>> = {};
  for (const [code, fromEur] of Object.entries(data.rates)) {
    if (code in Currency) {
      rates[code as Currency] = 1 / fromEur;
    }
  }
  return rates;
}
