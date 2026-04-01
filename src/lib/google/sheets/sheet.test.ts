import { describe, it, expect, vi } from 'vitest';
import { Sheet } from './sheet.ts';
import type { SpreadsheetsApi } from './spreadsheets_api.ts';

describe('Sheet', () => {
  describe('read', () => {
    it('delegates to api.readValues with the sheet title', async () => {
      const api = { readValues: vi.fn().mockResolvedValue(null) } as unknown as SpreadsheetsApi;
      await new Sheet(api, 10, 'MySheet').read();
      expect(api.readValues).toHaveBeenCalledWith('MySheet');
    });

    it('returns the value from api.readValues', async () => {
      const rows = [[{ value: 'A' }, { value: 1 }]];
      const api = { readValues: vi.fn().mockResolvedValue(rows) } as unknown as SpreadsheetsApi;
      expect(await new Sheet(api, 10, 'MySheet').read()).toBe(rows);
    });
  });

  describe('write', () => {
    it('delegates to api.updateCells with the sheet id and rows', async () => {
      const api = {
        updateCells: vi.fn().mockResolvedValue(undefined),
      } as unknown as SpreadsheetsApi;
      const rows = [[{ value: 'hello' }, { value: 42 }]];
      await new Sheet(api, 42, 'MySheet').write(rows);
      expect(api.updateCells).toHaveBeenCalledWith(42, rows);
    });
  });
});
