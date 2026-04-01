// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  loadGis,
  requestDriveToken,
  requestDriveTokenSilently,
  getAuthenticatedEmail,
} from './auth.ts';

describe('loadGis', () => {
  afterEach(() => {
    document.head.querySelectorAll('script').forEach((s) => s.remove());
    Reflect.deleteProperty(window, 'google');
  });

  it('resolves immediately when GIS is already loaded', async () => {
    Object.assign(window, { google: { accounts: { oauth2: {} } } });
    await expect(loadGis()).resolves.toBeUndefined();
    expect(document.querySelector('script')).toBeNull();
  });

  it('appends a GIS script tag to the document head when not yet loaded', () => {
    loadGis();
    const script = document.querySelector('script');
    expect(script?.src).toBe('https://accounts.google.com/gsi/client');
  });

  it('resolves when the appended script fires onload', async () => {
    const promise = loadGis();
    const script = document.querySelector('script')!;
    script.onload!(new Event('load'));
    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects when the appended script fires onerror', async () => {
    const promise = loadGis();
    const script = document.querySelector('script')!;
    script.onerror!(new Event('error'));
    await expect(promise).rejects.toThrow('Failed to load Google Identity Services');
  });
});

function setupGoogleMock() {
  const requestAccessToken = vi.fn();
  let capturedCallback: ((r: { access_token: string; error?: string }) => void) | undefined;

  const initTokenClient = vi
    .fn()
    .mockImplementation(
      ({ callback }: { callback: (r: { access_token: string; error?: string }) => void }) => {
        capturedCallback = callback;
        return { requestAccessToken };
      },
    );

  Object.defineProperty(window, 'google', {
    value: { accounts: { oauth2: { initTokenClient } } },
    writable: true,
    configurable: true,
  });

  return {
    initTokenClient,
    requestAccessToken,
    resolve: (token: string) => capturedCallback!({ access_token: token }),
    reject: (error: string) => capturedCallback!({ access_token: '', error }),
  };
}

describe('requestDriveToken', () => {
  it('resolves with the access token on successful auth', async () => {
    const mock = setupGoogleMock();
    mock.requestAccessToken.mockImplementation(() => mock.resolve('abc123'));
    await expect(requestDriveToken('my-client-id')).resolves.toBe('abc123');
  });

  it('passes the client id and required scope to initTokenClient', async () => {
    const mock = setupGoogleMock();
    mock.requestAccessToken.mockImplementation(() => mock.resolve('token'));
    await requestDriveToken('client-xyz');
    expect(mock.initTokenClient).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'client-xyz',
        scope: 'https://www.googleapis.com/auth/drive.file email',
      }),
    );
  });

  it('calls requestAccessToken with no prompt option', async () => {
    const mock = setupGoogleMock();
    mock.requestAccessToken.mockImplementation(() => mock.resolve('token'));
    await requestDriveToken('client-id');
    expect(mock.requestAccessToken).toHaveBeenCalledWith({});
  });

  it('rejects when the auth response contains an error', async () => {
    const mock = setupGoogleMock();
    mock.requestAccessToken.mockImplementation(() => mock.reject('access_denied'));
    await expect(requestDriveToken('client-id')).rejects.toThrow('access_denied');
  });
});

describe('requestDriveTokenSilently', () => {
  it('calls requestAccessToken with an empty prompt to suppress the consent screen', async () => {
    const mock = setupGoogleMock();
    mock.requestAccessToken.mockImplementation(() => mock.resolve('token'));
    await requestDriveTokenSilently('client-id');
    expect(mock.requestAccessToken).toHaveBeenCalledWith({ prompt: '' });
  });

  it('includes hint in the options when provided', async () => {
    const mock = setupGoogleMock();
    mock.requestAccessToken.mockImplementation(() => mock.resolve('token'));
    await requestDriveTokenSilently('client-id', 'user@example.com');
    expect(mock.requestAccessToken).toHaveBeenCalledWith({ prompt: '', hint: 'user@example.com' });
  });

  it('omits hint from the options when not provided', async () => {
    const mock = setupGoogleMock();
    mock.requestAccessToken.mockImplementation(() => mock.resolve('token'));
    await requestDriveTokenSilently('client-id');
    const [options] = mock.requestAccessToken.mock.calls[0];
    expect(options).not.toHaveProperty('hint');
  });
});

describe('getAuthenticatedEmail', () => {
  it('fetches the userinfo endpoint with the bearer token', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ email: 'user@example.com' }),
    });
    vi.stubGlobal('fetch', mockFetch);
    await getAuthenticatedEmail('secret-token');
    expect(mockFetch).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer secret-token' },
    });
  });

  it('returns the email from the userinfo response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ email: 'user@example.com', sub: '12345' }),
      }),
    );
    expect(await getAuthenticatedEmail('token')).toBe('user@example.com');
  });

  it('returns null when the response contains no email', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ sub: '12345' }),
      }),
    );
    expect(await getAuthenticatedEmail('token')).toBeNull();
  });
});
