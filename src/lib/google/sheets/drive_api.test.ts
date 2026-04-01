import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriveApi } from './drive_api.ts';
import { getJson } from '../../utils/net.ts';

vi.mock('../../utils/net.ts', () => ({ getJson: vi.fn() }));

describe('DriveApi', () => {
  describe('findSpreadsheetId', () => {
    beforeEach(() => vi.mocked(getJson).mockReset());

    it('queries Drive with the spreadsheet name and mime type filter', async () => {
      vi.mocked(getJson).mockResolvedValue({ files: [] });
      await new DriveApi('my-token').findSpreadsheetId('My Sheet');
      const expectedQ = encodeURIComponent(
        "name='My Sheet' and mimeType='application/vnd.google-apps.spreadsheet'",
      );
      expect(getJson).toHaveBeenCalledWith(
        `https://www.googleapis.com/drive/v3/files?spaces=drive&q=${expectedQ}&fields=files(id)`,
        { bearerToken: 'my-token' },
      );
    });

    it('returns the id of the first matching file', async () => {
      vi.mocked(getJson).mockResolvedValue({ files: [{ id: 'sheet-id-1' }, { id: 'sheet-id-2' }] });
      const id = await new DriveApi('token').findSpreadsheetId('name');
      expect(id).toBe('sheet-id-1');
    });

    it('returns null when no files match', async () => {
      vi.mocked(getJson).mockResolvedValue({ files: [] });
      const id = await new DriveApi('token').findSpreadsheetId('name');
      expect(id).toBeNull();
    });
  });
});
