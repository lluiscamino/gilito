import { getJson } from '../../utils/net.ts';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

export class DriveApi {
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  async findSpreadsheetId(name: string): Promise<string | null> {
    const q = encodeURIComponent(
      `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'`,
    );
    const data = await getJson<{ files: { id: string }[] }>(
      `${DRIVE_API}/files?spaces=drive&q=${q}&fields=files(id)`,
      { bearerToken: this.token },
    );
    return data.files[0]?.id ?? null;
  }
}
