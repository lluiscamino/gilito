export interface RequestOptions {
  bearerToken?: string;
}

export async function getJson<T>(url: string, options?: RequestOptions): Promise<T> {
  const res = await fetch(url, { headers: authHeaders(options) });
  return res.json() as Promise<T>;
}

export async function postJson<T>(
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const hasBody = body !== undefined;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...authHeaders(options),
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}

function authHeaders(options?: RequestOptions): Record<string, string> {
  return options?.bearerToken ? { Authorization: `Bearer ${options.bearerToken}` } : {};
}
