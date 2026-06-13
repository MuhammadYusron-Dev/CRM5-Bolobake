import { google } from 'googleapis';

// Parse the private key because sometimes environment variables escape the newlines
const privateKey = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n');

// Configure the auth client
export const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: privateKey,
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ],
});

export const sheets = google.sheets({ version: 'v4', auth });
export const drive = google.drive({ version: 'v3', auth });

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_ID;

export async function uploadImage(file: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    
    const body = new URLSearchParams();
    body.append('image', base64Data);
    body.append('type', 'base64');

    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      body: body,
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7'
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      return data.data.link;
    }
    
    const errorText = await res.text();
    return `ERROR_UPLOAD: ${res.status} - ${errorText}`;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return `ERROR_UPLOAD: ${error.message}`;
  }
}

let adminsSheetVerified = false;

export async function ensureAdminsSheet() {
  if (adminsSheetVerified) return;
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === 'Admins');
    
    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: 'Admins' } } }] }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Admins!A1:C1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['Username', 'PasswordHash', 'AvatarUrl']] }
      });
    }
    adminsSheetVerified = true;
  } catch (error) {
    console.error('Error ensuring Admins sheet:', error);
  }
}

export async function getAdmins() {
  await ensureAdminsSheet();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Admins!A2:C',
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];
    
    return rows.map(row => ({
      username: row[0],
      passwordHash: row[1],
      avatarUrl: row[2] || '',
    }));
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

export async function addAdmin(username: string, passwordHash: string, avatarUrl: string) {
  await ensureAdminsSheet();
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Admins!A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[username, passwordHash, avatarUrl]]
      }
    });
    return true;
  } catch (error) {
    console.error('Error adding admin:', error);
    return false;
  }
}
