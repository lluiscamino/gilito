import { Chart } from 'chart.js';
import {
  getAuthenticatedEmail,
  loadGis,
  requestDriveToken,
  requestDriveTokenSilently,
} from '../lib/google/auth.ts';
import { App } from './components/app.ts';
import { SignInScreen } from './components/sign_in_screen.ts';
import { GoogleSheetsWealthRepository } from '../lib/data/google_sheets_wealth_repository.ts';

Chart.defaults.color = '#8A8A8E';
Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.06)';
Chart.defaults.font.family =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif";
Chart.defaults.font.size = 11;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const EMAIL_HINT_KEY = 'auth_email_hint';

export function initApp(root: HTMLElement): void {
  const hint = localStorage.getItem(EMAIL_HINT_KEY);
  loadGis()
    .then(() => (hint ? requestDriveTokenSilently(CLIENT_ID, hint) : Promise.reject()))
    .then((token) => {
      storeEmailHint(token);
      return loadApp(root, token);
    })
    .catch(() => showSignIn(root));
}

function showSignIn(root: HTMLElement): void {
  root.innerHTML = '';
  const screen = new SignInScreen(() => signIn(root));
  root.append(screen.render());
}

function signIn(root: HTMLElement): void {
  requestDriveToken(CLIENT_ID)
    .then((token) => {
      storeEmailHint(token);
      return loadApp(root, token);
    })
    .catch((err: unknown) => {
      console.error('Sign-in failed:', err);
      showSignIn(root);
    });
}

async function loadApp(root: HTMLElement, token: string): Promise<void> {
  const repo = await GoogleSheetsWealthRepository.create(token);
  root.innerHTML = '';
  new App(repo).render(root);
}

function storeEmailHint(token: string): void {
  getAuthenticatedEmail(token)
    .then((email) => {
      if (email) localStorage.setItem(EMAIL_HINT_KEY, email);
    })
    .catch((e) => {
      console.error('Failed to get authenticated email', e);
    });
}
