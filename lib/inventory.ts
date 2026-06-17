import { sheets, SPREADSHEET_ID, ensureInventorySheets } from '@/lib/google-sheets';
import { eventBus } from '@/lib/events';

export interface InventoryItem {
  sku: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

export async function getInventory(): Promise<InventoryItem[]> {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inventory!A2:D',
    });
    const rows = response.data.values || [];
    return rows.map(row => ({
      sku: row[0] || '',
      totalStock: parseInt(row[1] || '0', 10),
      reservedStock: parseInt(row[2] || '0', 10),
      availableStock: parseInt(row[3] || '0', 10),
    })).filter(item => item.sku !== '');
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

export async function updateInventoryRow(sku: string, totalStock: number, reservedStock: number) {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inventory!A:D',
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === sku);
    const availableStock = totalStock - reservedStock;

    if (rowIndex === -1) {
      // Add new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Inventory!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[sku, totalStock, reservedStock, `=INDIRECT("B"&ROW())-INDIRECT("C"&ROW())`]]
        }
      });
    } else {
      // Update existing row (rowIndex is 0-based, Sheets is 1-based)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Inventory!A${rowIndex + 1}:D${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[sku, totalStock, reservedStock, `=INDIRECT("B"&ROW())-INDIRECT("C"&ROW())`]]
        }
      });
    }
  } catch (error) {
    console.error(`Error updating inventory for SKU ${sku}:`, error);
  }
}

// Handle Order Created Event
eventBus.on('ORDER_CREATED', async (order) => {
  console.log('[Inventory] Processing ORDER_CREATED event for order:', order.id);
  const currentInventory = await getInventory();

  for (const item of order.items || []) {
    const sku = item.sku;
    const qty = item.qty;
    
    if (!sku || qty <= 0) continue;

    const inventoryItem = currentInventory.find(i => i.sku === sku);
    
    const totalStock = inventoryItem ? inventoryItem.totalStock : 0;
    let reservedStock = inventoryItem ? inventoryItem.reservedStock : 0;
    const availableStock = inventoryItem ? inventoryItem.availableStock : 0;

    // Reserve stock unconditionally (it represents what we owe the customer)
    reservedStock += qty;

    await updateInventoryRow(sku, totalStock, reservedStock);

    // Check if we need production
    if (availableStock < qty) {
      const deficit = qty - availableStock;
      console.log(`[Inventory] Insufficient stock for ${sku}. Deficit: ${deficit}`);
      eventBus.emit('STOCK_INSUFFICIENT', {
        sku,
        deficit,
        productionDate: order.productionDate || new Date().toISOString().split('T')[0],
        orderId: order.id
      });
    }
  }
});
