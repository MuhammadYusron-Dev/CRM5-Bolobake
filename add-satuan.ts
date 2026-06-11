import { sheets, SPREADSHEET_ID } from './lib/google-sheets';

async function updateKatalogSatuan() {
  try {
    // 1. Get existing rows to know how many to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A:A', // Just get column A to count rows
    });

    const rows = response.data.values || [];
    const rowCount = rows.length;

    if (rowCount === 0) {
      console.log('No rows found in Master Katalog.');
      return;
    }

    // 2. Prepare the values for Column F
    // F1 = "Satuan"
    // F2:Fn = "pcs"
    const satuanValues = rows.map((_, index) => {
      if (index === 0) return ['Satuan'];
      return ['pcs'];
    });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === 'Master Katalog');
    
    if (sheet?.properties?.sheetId !== undefined) {
      // First, check if column F exists, if not, append 1 column
      if ((sheet.properties.gridProperties?.columnCount || 0) < 6) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                appendDimension: {
                  sheetId: sheet.properties.sheetId,
                  dimension: 'COLUMNS',
                  length: 6 - sheet.properties.gridProperties.columnCount
                }
              }
            ]
          }
        });
      }
    }

    // 3. Update Column F
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Master Katalog!F1:F${rowCount}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: satuanValues,
      },
    });

    // 4. Format Header for Column F to match others
    if (sheet?.properties?.sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheet.properties.sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 5, // Column F
                  endColumnIndex: 6
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    horizontalAlignment: 'CENTER',
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                  }
                },
                fields: 'userEnteredFormat(textFormat,horizontalAlignment,backgroundColor)'
              }
            }
          ]
        }
      });
    }

    console.log(`Successfully added 'Satuan' column to ${rowCount} rows in Master Katalog.`);
  } catch (error) {
    console.error('Error updating Master Katalog:', error);
  }
}

updateKatalogSatuan();
