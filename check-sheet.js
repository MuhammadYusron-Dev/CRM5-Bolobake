const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const sheets = google.sheets({ version: 'v4', auth });

async function checkSheet() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A1:Z',
    });
    console.log("Number of rows:", res.data.values?.length || 0);
    if (res.data.values) {
      res.data.values.forEach((row, i) => {
        if (row.length > 0 && i < 10) {
          console.log(`Row ${i + 1}:`, row);
        }
        // Print the last 5 rows as well to see if there are empty rows pushing data down
        if (res.data.values && i > res.data.values.length - 6 && row.length > 0) {
          console.log(`Row ${i + 1}:`, row);
        }
      });
    }
  } catch (e) {
    console.error("Error fetching:", e.message);
  }
}

checkSheet();
