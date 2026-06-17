import { sheets, SPREADSHEET_ID, ensureInventorySheets } from '@/lib/google-sheets';
import { eventBus } from '@/lib/events';

// --- MUTEX LOCK MANAGER ---
class Mutex {
  private locks = new Map<string, Promise<void>>();

  async lock(key: string): Promise<() => void> {
    const existingLock = this.locks.get(key);
    let resolveLock!: () => void;
    const newLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    if (existingLock) {
      this.locks.set(key, existingLock.then(() => newLock));
      await existingLock;
    } else {
      this.locks.set(key, newLock);
    }

    return () => {
      resolveLock();
      if (this.locks.get(key) === newLock) {
        this.locks.delete(key);
      }
    };
  }
}
const inventoryMutex = new Mutex();

// --- RETRY WRAPPER ---
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      console.warn(`[Inventory] Action failed, attempt ${attempt}/${retries}. Error:`, error.message);
      if (attempt >= retries) throw error;
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
  throw new Error("Unreachable");
}

export interface InventoryItem {
  sku: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

export async function getInventory(): Promise<InventoryItem[]> {
  await ensureInventorySheets();
  return withRetry(async () => {
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
  });
}

export async function adjustStock(
  sku: string, 
  totalStockDiff: number, 
  reservedStockDiff: number, 
  movementType: string, 
  refType: string, 
  refId: string, 
  notes: string = ''
): Promise<{ totalStock: number, reservedStock: number, availableStock: number }> {
  await ensureInventorySheets();
  const unlock = await inventoryMutex.lock(`inv_${sku}`);
  
  try {
    return await withRetry(async () => {
      // 1. Fetch current row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Inventory!A:D',
      });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === sku);

      let totalStock = 0;
      let reservedStock = 0;

      if (rowIndex !== -1) {
        totalStock = parseInt(rows[rowIndex][1] || '0', 10);
        reservedStock = parseInt(rows[rowIndex][2] || '0', 10);
      }

      totalStock += totalStockDiff;
      reservedStock += reservedStockDiff;
      const availableStock = totalStock - reservedStock;

      // 2. Update Row
      if (rowIndex === -1) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Inventory!A:D',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[sku, totalStock, reservedStock, `=INDIRECT("B"&ROW())-INDIRECT("C"&ROW())`]]
          }
        });
      } else {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Inventory!A${rowIndex + 1}:D${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[sku, totalStock, reservedStock, `=INDIRECT("B"&ROW())-INDIRECT("C"&ROW())`]]
          }
        });
      }

      // 3. Log Movement
      const quantity = Math.abs(totalStockDiff) > 0 ? Math.abs(totalStockDiff) : Math.abs(reservedStockDiff);
      const id = `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const timestamp = new Date().toISOString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'InventoryMovements!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[id, timestamp, sku, movementType, quantity, refType, refId, 'SYSTEM_AUTO', notes]]
        }
      });

      return { totalStock, reservedStock, availableStock };
    });
  } catch (error) {
    console.error(`Error adjusting stock for SKU ${sku}:`, error);
    throw error;
  } finally {
    unlock();
  }
}

// Handle Order Created Event
eventBus.on('ORDER_CREATED', async (order) => {
  console.log('[Inventory] Processing ORDER_CREATED event for order:', order.id);
  
  for (const item of order.items || []) {
    const sku = item.sku;
    const qty = item.qty;
    
    if (!sku || qty <= 0) continue;

    try {
      // Atomsically adjust stock (reserve)
      const { availableStock } = await adjustStock(
        sku, 
        0, 
        qty, 
        'RESERVATION', 
        'ORDER', 
        String(order.id), 
        `Reserved for customer ${order.customer}`
      );

      // Check if we need production
      // Wait, availableStock is calculated AFTER reservation. So if availableStock < 0, we have a deficit.
      // E.g., old total 10, old reserved 0, available 10. qty 15.
      // new total 10, new reserved 15, available -5. Deficit = 5.
      if (availableStock < 0) {
        const deficit = Math.abs(availableStock);
        console.log(`[Inventory] Insufficient stock for ${sku}. Deficit: ${deficit}`);
        eventBus.emit('STOCK_INSUFFICIENT', {
          sku,
          deficit,
          productionDate: order.productionDate || new Date().toISOString().split('T')[0],
          orderId: order.id
        });
      }
    } catch (e) {
      console.error(`[Inventory] Failed to process item ${sku} for order ${order.id}:`, e);
    }
  }
});
