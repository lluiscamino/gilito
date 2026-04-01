interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: { access_token: string; error?: string }) => void;
}

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: TokenClientConfig): {
            requestAccessToken(options?: { prompt?: string; hint?: string }): void;
          };
        };
      };
    };
  }
}

export function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export function requestDriveToken(clientId: string): Promise<string> {
  return requestToken(clientId, {});
}

export function requestDriveTokenSilently(clientId: string, hint?: string): Promise<string> {
  return requestToken(clientId, { prompt: '', ...(hint && { hint }) });
}

export async function getAuthenticatedEmail(token: string): Promise<string | null> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

function requestToken(
  clientId: string,
  options: { prompt?: string; hint?: string },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file email',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.access_token);
        }
      },
    });
    client.requestAccessToken(options);
  });
}
