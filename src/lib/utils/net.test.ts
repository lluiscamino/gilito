import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJson, postJson } from './net.ts';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const jsonResponse = (data: unknown) => ({ json: () => Promise.resolve(data) });

describe('getJson', () => {
  beforeEach(() => mockFetch.mockReset());

  it('fetches the given URL', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await getJson('https://api.example.com/endpoint');
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/endpoint', expect.any(Object));
  });

  it('returns the parsed JSON body', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ count: 3, items: ['a', 'b'] }));
    const result = await getJson<{ count: number; items: string[] }>(
      'https://api.example.com/endpoint',
    );
    expect(result).toEqual({ count: 3, items: ['a', 'b'] });
  });

  it('sends an Authorization header when a bearerToken is provided', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await getJson('https://api.example.com/endpoint', { bearerToken: 'tok123' });
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/endpoint', {
      headers: { Authorization: 'Bearer tok123' },
    });
  });

  it('sends no Authorization header when bearerToken is absent', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await getJson('https://api.example.com/endpoint');
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/endpoint', { headers: {} });
  });
});

describe('postJson', () => {
  beforeEach(() => mockFetch.mockReset());

  it('uses the POST method', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await postJson('https://api.example.com/endpoint');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
  });

  it('returns the parsed JSON body', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 99 }));
    const result = await postJson<{ id: number }>('https://api.example.com/endpoint', {});
    expect(result).toEqual({ id: 99 });
  });

  it('serialises the body as JSON and sets Content-Type when a body is provided', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await postJson('https://api.example.com/endpoint', { name: 'Alice', age: 30 });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBe(JSON.stringify({ name: 'Alice', age: 30 }));
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('omits body and Content-Type header when no body is provided', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await postJson('https://api.example.com/endpoint');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeUndefined();
    expect(options.headers['Content-Type']).toBeUndefined();
  });

  it('sends an Authorization header when a bearerToken is provided', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));
    await postJson('https://api.example.com/endpoint', undefined, { bearerToken: 'tok456' });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer tok456');
  });
});
