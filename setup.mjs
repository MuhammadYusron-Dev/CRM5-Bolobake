import { google } from 'googleapis';
import fs from 'fs';

// Read from .env.local manually
const envRaw = fs.readFileSync('.env.local', 'utf8');
const env = {};
envRaw.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const privateKey = env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;

async function setup() {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = response.data.sheets?.map((s) => s.properties?.title) || [];
    
    const requests = [];

    if (!existingSheets.includes('Laporan Transaksi Harian')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Laporan Transaksi Harian',
            gridProperties: { rowCount: 1000, columnCount: 10 }
          }
        }
      });
    }

    if (!existingSheets.includes('Master Katalog')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Master Katalog',
            gridProperties: { rowCount: 500, columnCount: 5 }
          }
        }
      });
    }

    if (requests.length > 0) {
      console.log('Creating sheets...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests },
      });
    }

    console.log('Setting headers...');
    const laporanResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A1:I1',
    });

    if (!laporanResponse.data.values || laporanResponse.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Laporan Transaksi Harian!A1:I1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Timestamp', 'Customer', 'Rincian Produksi', 'Total Pcs', 'Subtotal', 'Ongkos Kirim', 'Grand Total', 'Catatan Produksi', 'Status']],
        },
      });
    }

    const katalogResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A1:E1',
    });

    if (!katalogResponse.data.values || katalogResponse.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Master Katalog!A1:E1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['SKU ID', 'Nama Produk', 'Kategori', 'Harga Default', 'Status Aktif']],
        },
      });
      
      console.log('Seeding data...');
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Master Katalog!A2:E9',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            ['SKU-001', 'Classic Bagel', 'Bagel', '15000', 'TRUE'],
            ['SKU-002', 'Sourdough Loaf', 'Bread', '45000', 'TRUE'],
            ['SKU-003', 'Butter Croissant', 'Viennoiserie', '20000', 'TRUE'],
            ['SKU-004', 'Cinnamon Roll', 'Pastry', '22000', 'TRUE'],
            ['SKU-005', 'Baguette Traditional', 'Bread', '25000', 'TRUE'],
            ['SKU-006', 'Pain au Chocolat', 'Viennoiserie', '24000', 'TRUE'],
            ['SKU-007', 'Focaccia Rosemary', 'Bread', '35000', 'TRUE'],
            ['SKU-008', 'Brioche Bun (Pack of 6)', 'Bread', '40000', 'TRUE'],
          ],
        },
      });
    }

    console.log('Setup complete!');
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setup();
