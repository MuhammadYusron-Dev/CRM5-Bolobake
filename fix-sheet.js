const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2];
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val.replace(/\\n/g, '\n');
  }
});

const SPREADSHEET_ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;
const clientEmail = env.GOOGLE_SHEETS_CLIENT_EMAIL;
const privateKey = env.GOOGLE_SHEETS_PRIVATE_KEY;

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function fixSheet() {
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A2:Z',
    });
    console.log("Cleared Laporan Transaksi Harian");
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Rekap Produksi!A2:Z',
    });
    console.log("Cleared Rekap Produksi");
  } catch (e) {
    console.error("Error:", e.message);
  }
}

fixSheet();
