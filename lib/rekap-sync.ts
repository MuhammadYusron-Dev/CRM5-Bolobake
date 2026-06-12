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
    const orders = orderRows.map((row, index) => {
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
        status: row[10] || '',
        originalIndex: index
      };
    });

    // Sort orders by production date, then original input order
    orders.sort((a, b) => {
      // Very basic string sort if they are in YYYY-MM-DD, otherwise input order
      if (a.productionDate < b.productionDate) return -1;
      if (a.productionDate > b.productionDate) return 1;
      return a.originalIndex - b.originalIndex;
    });

    // 3. Generate Rekap Rows
    const rekapRows: any[][] = [];
    
    rekapRows.push([
      'DATE', 'NO', 'OUTLET', 'ONGKIR', 
      'CROISSANT / ARTISAN BAKERY', 'QTY', 'SATUAN', 
      'CAKE / OTHER', 'QTY', 'SATUAN'
    ]);

    let currentDate = '';
    let currentCustomerCount = 0;
    const dateStartRows: number[] = [];

    for (const order of orders) {
      if (order.status?.toLowerCase() === 'cancelled') continue; // Skip cancelled

      // Determine Date display
      let displayDate = '';
      if (order.productionDate !== currentDate) {
        currentDate = order.productionDate;
        displayDate = currentDate;
        currentCustomerCount = 1;
        
        if (rekapRows.length > 1) {
          dateStartRows.push(rekapRows.length);
        }
      } else {
        currentCustomerCount++;
      }

      let displayNo = currentCustomerCount.toString();
      let displayCustomer = order.customer;
      
      // Parse delivery from notes
      let rawNotes = order.notes || '';
      
      let imageUrl = '';
      const imageMatch = rawNotes.match(/\[IMAGE_URL:(.*?)\]/);
      if (imageMatch) {
        imageUrl = imageMatch[1];
        rawNotes = rawNotes.replace(/\[IMAGE_URL:.*?\]/, '').trim();
      }

      const deliveryMatch = rawNotes.match(/^\[Delivery: (.*?)\]\n?/);
      if (deliveryMatch) {
        displayCustomer += `\n${deliveryMatch[1]}`;
        rawNotes = rawNotes.replace(/^\[Delivery: (.*?)\]\n?/, '').trim();
      }
      
      if (order.deliveryDateStr) {
        displayCustomer += `\nKirim: ${order.deliveryDateStr}`;
      }
      
      if (rawNotes) {
        displayCustomer += `\nNote: ${rawNotes}`;
      }
      
      let displayOngkir = '';
      const ongkirNum = Number(String(order.shippingCost).replace(/\D/g, ''));
      if (ongkirNum > 0) displayOngkir = `Rp${ongkirNum.toLocaleString('id-ID')}`;

      // Split items into categories
      const leftItems = [];
      const rightItems = [];

      for (const item of order.items) {
        let baseSku = item.sku;
        if (baseSku.endsWith(' (sample)')) {
          baseSku = baseSku.replace(' (sample)', '');
        }
        const data = skuData[baseSku] || { category: '', satuan: 'pcs' };
        if (isCakeOrOther(data.category)) {
          rightItems.push({ ...item, satuan: data.satuan });
        } else {
          leftItems.push({ ...item, satuan: data.satuan });
        }
      }

      // Figure out how many rows this order takes
      const rowCount = Math.max(leftItems.length, rightItems.length, imageUrl ? 2 : 1);

      for (let i = 0; i < rowCount; i++) {
        const isFirst = i === 0;
        const isSecond = i === 1;
        const leftItem = leftItems[i];
        const rightItem = rightItems[i];

        let outletContent = '';
        if (isFirst) {
          outletContent = displayCustomer;
        } else if (isSecond && imageUrl && !imageUrl.startsWith('ERROR')) {
          outletContent = `=HYPERLINK("${imageUrl}", "🖼️ Lihat Foto Lampiran")`;
        } else if (isSecond && imageUrl) {
          outletContent = imageUrl;
        }

        rekapRows.push([
          isFirst ? displayDate : '',                     // A: DATE
          isFirst ? displayNo : '',                       // B: NO
          outletContent,                                  // C: OUTLET
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
        // Column Widths
        { updateDimensionProperties: { range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 300 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 5, endIndex: 7 }, properties: { pixelSize: 70 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId: rekapSheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 8, endIndex: 10 }, properties: { pixelSize: 70 }, fields: 'pixelSize' } },
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
        },
        {
          updateBorders: {
            range: {
              sheetId: rekapSheet.properties.sheetId,
              startRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 10
            },
            top: { style: 'NONE' },
            bottom: { style: 'NONE' },
            innerHorizontal: { style: 'NONE' }
          }
        }
      ];

      for (const rowIndex of dateStartRows) {
        formatRequests.push({
          updateBorders: {
            range: {
              sheetId: rekapSheet.properties.sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 0,
              endColumnIndex: 10
            },
            top: {
              style: 'SOLID',
              width: 1,
              color: { red: 0, green: 0, blue: 0 }
            }
          }
        });
      }

      // Add rich text format for Outlet and Sample columns
      for (let i = 1; i < rekapRows.length; i++) { // skip header at 0
        const row = rekapRows[i];
        
        // Outlet (C: index 2)
        const outletVal = row[2] as string;
        if (outletVal) {
          const parts = outletVal.split('\n');
          const runs: any[] = [];
          
          let currentIdx = 0;
          runs.push({ startIndex: currentIdx, format: { bold: true, foregroundColor: { red: 0, green: 0, blue: 0 } } });
          currentIdx += parts[0].length;
          
          for (let p = 1; p < parts.length; p++) {
            currentIdx += 1; // Account for the newline character
            if (parts[p].startsWith('Note:')) {
              runs.push({ startIndex: currentIdx, format: { bold: false, italic: true, foregroundColor: { red: 1, green: 0, blue: 0 } } });
            } else {
              runs.push({ startIndex: currentIdx, format: { bold: false, italic: true, foregroundColor: { red: 0, green: 0, blue: 0 } } });
            }
            currentIdx += parts[p].length;
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

        // Croissant SKU (E: index 4)
        const sku1 = row[4] as string;
        if (sku1 && sku1.includes('(sample)')) {
          const sampleIndex = sku1.indexOf('(sample)');
          const runs: any[] = [ 
            { startIndex: 0, format: { foregroundColor: { red: 0, green: 0, blue: 0 } } },
            { startIndex: sampleIndex, format: { italic: true, fontSize: 8, foregroundColor: { red: 1, green: 0, blue: 0 } } }
          ];
          formatRequests.push({
            updateCells: {
              rows: [{
                values: [{
                  userEnteredValue: { stringValue: sku1 },
                  textFormatRuns: runs
                }]
              }],
              fields: 'userEnteredValue,textFormatRuns',
              start: { sheetId: rekapSheet.properties.sheetId, rowIndex: i, columnIndex: 4 }
            }
          });
        }

        // Cake SKU (H: index 7)
        const sku2 = row[7] as string;
        if (sku2 && sku2.includes('(sample)')) {
          const sampleIndex = sku2.indexOf('(sample)');
          const runs: any[] = [ 
            { startIndex: 0, format: { foregroundColor: { red: 0, green: 0, blue: 0 } } },
            { startIndex: sampleIndex, format: { italic: true, fontSize: 8, foregroundColor: { red: 1, green: 0, blue: 0 } } }
          ];
          formatRequests.push({
            updateCells: {
              rows: [{
                values: [{
                  userEnteredValue: { stringValue: sku2 },
                  textFormatRuns: runs
                }]
              }],
              fields: 'userEnteredValue,textFormatRuns',
              start: { sheetId: rekapSheet.properties.sheetId, rowIndex: i, columnIndex: 7 }
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

export async function syncCapacity(targetDate: string) {
  try {
    if (!SPREADSHEET_ID || !targetDate) return false;

    // 1. Calculate total booked_pcs for this date from Laporan Transaksi Harian
    const ordersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A2:M',
    });
    const orderRows = ordersRes.data.values || [];
    
    let totalBooked = 0;
    orderRows.forEach(row => {
      const status = row[10] || '';
      if (status.toLowerCase() !== 'cancelled') {
        const rowDate = row[11] || ''; // Tanggal Produksi
        if (rowDate === targetDate) {
          const totalPcs = parseInt(row[5] || '0', 10);
          totalBooked += isNaN(totalPcs) ? 0 : totalPcs;
        }
      }
    });

    // 2. Update production_capacities
    const capRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'production_capacities!A2:C',
    });
    const capRows = capRes.data.values || [];
    const rowIndex = capRows.findIndex(row => row[0] === targetDate);

    if (rowIndex !== -1) {
      // Update existing row (Row 2 is index 0)
      const sheetRow = rowIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `production_capacities!C${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[totalBooked]] }
      });
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'production_capacities!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[targetDate, 1000, totalBooked]]
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing capacity:', error);
    return false;
  }
}

export async function syncLaporanBorders() {
  try {
    if (!SPREADSHEET_ID) return false;

    // Fetch Laporan Transaksi Harian
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A2:M',
    });

    const rows = res.data.values || [];
    if (rows.length === 0) return true;

    // Get Sheet ID
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === 'Laporan Transaksi Harian');
    
    if (!sheet || sheet.properties?.sheetId === undefined) {
      return false;
    }
    const sheetId = sheet.properties.sheetId;

    let currentDate = '';
    const dateStartRows: number[] = [];

    // Row A2 starts at index 1
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowDate = row[11] || ''; // Tanggal Produksi is column L (index 11)
      
      // Skip empty dates or first row date setting
      if (rowDate) {
        if (!currentDate) {
          currentDate = rowDate; // First valid date
        } else if (rowDate !== currentDate) {
          currentDate = rowDate;
          dateStartRows.push(i + 1); // i=0 is A2 (index 1), i=1 is A3 (index 2)
        }
      }
    }

    const formatRequests: any[] = [
      // Clear existing horizontal borders from row 2 downwards, up to column J
      {
        updateBorders: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1, // Start from A2
            startColumnIndex: 0,
            endColumnIndex: 10 // Up to column J
          },
          top: { style: 'NONE' },
          bottom: { style: 'NONE' },
          innerHorizontal: { style: 'NONE' }
        }
      }
    ];

    // Add top border for each new date row
    for (const rowIndex of dateStartRows) {
      formatRequests.push({
        updateBorders: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 10 // Up to column J
          },
          top: {
            style: 'SOLID_MEDIUM', // Using slightly thicker line for better visibility
            width: 1,
            color: { red: 0, green: 0, blue: 0 }
          }
        }
      });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: formatRequests
      }
    });

    console.log('Successfully synced Laporan Transaksi Harian borders');
    return true;
  } catch (error) {
    console.error('Error syncing Laporan Transaksi Harian borders:', error);
    return false;
  }
}

