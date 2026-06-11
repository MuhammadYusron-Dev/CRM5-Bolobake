import { sheets, SPREADSHEET_ID } from './google-sheets';

const REKAP_SHEET_NAME = 'Rekap Produksi';

// Helper to determine if a category belongs to Cake/Other
function isCakeOrOther(category: string): boolean {
  const cat = category.toLowerCase();
  if (cat.includes('cake') || cat.includes('cookie') || cat.includes('dessert') || cat.includes('sweet') || cat.includes('snack') || cat.includes('other')) {
    return true;
  }
  return false; // Default to Croissant / Artisan Bakery
}

export async function syncRekapSheet() {
  try {
    if (!SPREADSHEET_ID) throw new Error('Missing SPREADSHEET_ID');

    // 1. Get Master Katalog to map SKU -> Category & Satuan
    const catalogRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A2:F',
    });
    
    const skuData: Record<string, { category: string, satuan: string }> = {};
    const catalogRows = catalogRes.data.values || [];
    catalogRows.forEach(row => {
      if (row[1]) {
        skuData[row[1].trim()] = {
          category: row[2] ? row[2].trim() : '',
          satuan: row[5] ? row[5].trim() : 'pcs'
        };
      }
    });

    // 2. Fetch all orders from Laporan Transaksi Harian
    const ordersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A2:M',
    });

    const orderRows = ordersRes.data.values || [];
    
    // Parse orders into structured data
    const orders = orderRows.map((row) => {
      let items: any[] = [];
      const colC = row[2] || '';
      const colD = row[3] || '';
      const colE = row[4] || '';

      const isOldFormat = !colD && !colE && colC.includes('(');

      if (isOldFormat) {
        items = colC.split('\n').filter(Boolean).map((line: string) => {
          const match = line.match(/-\s*(.+?)\s*\((\d+)\s*pcs/i);
          if (match) {
            return { sku: match[1].trim(), qty: parseInt(match[2], 10) };
          }
          return { sku: line.replace(/^- /, ''), qty: 1 };
        });
      } else {
        const names = colC.split('\n');
        const qtys = colD.split('\n');
        items = names.map((name: string, i: number) => ({
          sku: name.trim(),
          qty: parseInt(qtys[i] || '1', 10),
        })).filter((item: any) => item.sku !== '');
      }

      // Convert "Kamis, 15 Juni 2026" to a sortable date if possible, or just string match
      const rawProdDate = row[11] || ''; // Production Date (e.g. 2026-06-15)
      
      // If productionDate is empty, try to extract from Time display (row[0])
      let prodDate = rawProdDate;
      if (!prodDate && row[0]) {
        const pMatch = row[0].match(/Produksi:\s*(.+)/);
        if (pMatch) prodDate = pMatch[1].trim();
      }

      let delivDateStr = '';
      if (row[0]) {
        const dMatch = row[0].match(/Pengiriman:\s*(.+)/);
        if (dMatch) delivDateStr = dMatch[1].trim();
      }

      // Ensure consistent formatting (optional string manipulation if needed)
      
      return {
        timestamp: row[0],
        customer: row[1] || '',
        items: items,
        shippingCost: row[7] || '',
        notes: row[9] || '',
        productionDate: prodDate,
        deliveryDateStr: delivDateStr,
        status: row[10] || ''
      };
    });

    // Sort orders by production date, then customer name
    orders.sort((a, b) => {
      // Very basic string sort if they are in YYYY-MM-DD, otherwise alphabetical
      if (a.productionDate < b.productionDate) return -1;
      if (a.productionDate > b.productionDate) return 1;
      if (a.customer < b.customer) return -1;
      if (a.customer > b.customer) return 1;
      return 0;
    });

    // 3. Generate Rekap Rows
    const rekapRows: any[][] = [];
    
    // Header Row
    rekapRows.push([
      'DATE', 'NO', 'OUTLET', 'ONGKIR/NOTE', 
      'CROISSANT / ARTISAN BAKERY', 'QTY', 'SATUAN', 
      'CAKE / OTHER', 'QTY', 'SATUAN'
    ]);

    let currentDate = '';
    let currentCustomerCount = 0;

    for (const order of orders) {
      if (order.status?.toLowerCase() === 'cancelled') continue; // Skip cancelled

      // Determine Date display
      let displayDate = '';
      if (order.productionDate !== currentDate) {
        currentDate = order.productionDate;
        displayDate = currentDate;
        currentCustomerCount = 1;
      } else {
        currentCustomerCount++;
      }

      let displayNo = currentCustomerCount.toString();
      let displayCustomer = order.customer;
      
      // Parse delivery from notes
      let rawNotes = order.notes || '';
      const deliveryMatch = rawNotes.match(/^\[Delivery: (.*?)\]\n?/);
      if (deliveryMatch) {
        displayCustomer += `\n${deliveryMatch[1]}`;
        rawNotes = rawNotes.replace(/^\[Delivery: (.*?)\]\n?/, '');
      }
      
      if (order.deliveryDateStr) {
        displayCustomer += `\nKirim: ${order.deliveryDateStr}`;
      }
      
      let ongkirNote = [];
      const ongkirNum = Number(String(order.shippingCost).replace(/\D/g, ''));
      if (ongkirNum > 0) ongkirNote.push(`Ongkir: Rp${ongkirNum.toLocaleString('id-ID')}`);
      if (rawNotes) ongkirNote.push(`Note: ${rawNotes}`);
      let displayOngkir = ongkirNote.join('\n');

      // Split items into categories
      const leftItems = [];
      const rightItems = [];

      for (const item of order.items) {
        const data = skuData[item.sku] || { category: '', satuan: 'pcs' };
        if (isCakeOrOther(data.category)) {
          rightItems.push({ ...item, satuan: data.satuan });
        } else {
          leftItems.push({ ...item, satuan: data.satuan });
        }
      }

      // Figure out how many rows this order takes
      const rowCount = Math.max(leftItems.length, rightItems.length, 1);

      for (let i = 0; i < rowCount; i++) {
        const isFirst = i === 0;
        const leftItem = leftItems[i];
        const rightItem = rightItems[i];

        rekapRows.push([
          isFirst ? displayDate : '',                     // A: DATE
          isFirst ? displayNo : '',                       // B: NO
          isFirst ? displayCustomer : '',                 // C: OUTLET
          isFirst ? displayOngkir : '',                   // D: ONGKIR/NOTE
          leftItem ? leftItem.sku : '',                   // E: CROISSANT
          leftItem ? leftItem.qty : '',                   // F: QTY
          leftItem ? leftItem.satuan : '',                // G: SATUAN
          rightItem ? rightItem.sku : '',                 // H: CAKE
          rightItem ? rightItem.qty : '',                 // I: QTY
          rightItem ? rightItem.satuan : '',              // J: SATUAN
        ]);
      }
      
      // Add a small spacer row between orders for readability, except we might not need it if they prefer compact.
      // But looking at Gambar 1, there's no spacer row. Just straight to the next outlet.
    }

    // 4. Update the Rekap Produksi sheet
    // Get sheet ID
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    let rekapSheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === REKAP_SHEET_NAME);

    // If sheet doesn't exist, create it
    if (!rekapSheet) {
      const res = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: REKAP_SHEET_NAME,
                gridProperties: {
                  frozenRowCount: 1, // Freeze header
                  columnCount: 10
                }
              }
            }
          }]
        }
      });
      rekapSheet = res.data.replies?.[0].addSheet;
    }

    // Clear existing content and write new content
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${REKAP_SHEET_NAME}!A:J`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${REKAP_SHEET_NAME}!A1:J`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rekapRows
      }
    });

    // Formatting Header & Cells (Black background, white text, bold, centered)
    if (rekapSheet?.properties?.sheetId !== undefined) {
      const formatRequests: any[] = [
        {
          repeatCell: {
            range: {
              sheetId: rekapSheet.properties.sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 10
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 }, // Dark Gray/Black
                textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
            properties: { pixelSize: 200 },
            fields: 'pixelSize'
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 },
            properties: { pixelSize: 250 },
            fields: 'pixelSize'
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 },
            properties: { pixelSize: 200 },
            fields: 'pixelSize'
          }
        }
      ];

      // Add rich text format for Outlet column (C: index 2)
      for (let i = 1; i < rekapRows.length; i++) { // skip header at 0
        const row = rekapRows[i];
        const outletVal = row[2] as string;
        if (outletVal) {
          const parts = outletVal.split('\n');
          const runs: any[] = [ { startIndex: 0, format: { bold: true } } ];
          if (parts.length > 1) {
            runs.push({ startIndex: parts[0].length, format: { bold: false, italic: true } });
          }
          formatRequests.push({
            updateCells: {
              rows: [{
                values: [{
                  userEnteredValue: { stringValue: outletVal },
                  textFormatRuns: runs,
                  userEnteredFormat: {
                    wrapStrategy: 'WRAP',
                    verticalAlignment: 'TOP'
                  }
                }]
              }],
              fields: 'userEnteredValue,textFormatRuns,userEnteredFormat(wrapStrategy,verticalAlignment)',
              start: {
                sheetId: rekapSheet.properties.sheetId,
                rowIndex: i,
                columnIndex: 2
              }
            }
          });
        }
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: formatRequests
        }
      });
    }

    console.log('Successfully synced Rekap Produksi sheet');
    return true;
  } catch (error) {
    console.error('Error syncing Rekap Produksi sheet:', error);
    // Don't throw, just log so it doesn't break the main API flow
    return false;
  }
}
