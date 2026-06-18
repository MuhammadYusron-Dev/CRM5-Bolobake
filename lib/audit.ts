/**
 * Centralized Audit Trail Helper
 * Provides a single function to write structured audit logs from any component.
 */

export type AuditModule = 'ORDER' | 'CATALOG' | 'INVENTORY' | 'PRODUCTION' | 'SYSTEM' | 'SALES';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN';
export type AuditEntityType = 'ORDER' | 'PRODUCT' | 'INVENTORY_ITEM' | 'USER';

export interface AuditLogParams {
  userId?: string;
  userName?: string;
  module: AuditModule;
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  description: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  snapshot?: Record<string, any> | null;
}

/**
 * Generates a human-readable diff description comparing before and after data.
 */
export function generateDiffDescription(
  beforeData: Record<string, any>,
  afterData: Record<string, any>,
  fieldLabels?: Record<string, string>
): string {
  const changes: string[] = [];
  const labels: Record<string, string> = {
    customer: 'Customer',
    grandTotal: 'Grand Total',
    totalPcs: 'Total Pcs',
    productionDate: 'Tgl Produksi',
    deliveryDate: 'Tgl Pengiriman',
    status: 'Status',
    nama: 'Nama Produk',
    harga: 'Harga',
    kategori: 'Kategori',
    satuan: 'Satuan',
    aktif: 'Status Aktif',
    notes: 'Catatan',
    deliveryNotes: 'Catatan Pengiriman',
    shippingCost: 'Ongkir',
    isFreeShipping: 'Free Ongkir',
    ...fieldLabels
  };

  for (const key of Object.keys(afterData)) {
    if (key === 'id' || key === 'rowNumber' || key === 'rowIndex' || key === 'timestamp') continue;
    
    const before = beforeData[key];
    const after = afterData[key];

    // Skip complex nested objects (items array) for simple diff - handle separately
    if (Array.isArray(before) || Array.isArray(after)) continue;
    if (typeof before === 'object' && before !== null) continue;

    if (String(before ?? '') !== String(after ?? '')) {
      const label = labels[key] || key;
      const beforeStr = formatValue(key, before);
      const afterStr = formatValue(key, after);
      changes.push(`${label}: ${beforeStr} → ${afterStr}`);
    }
  }

  return changes.join('. ');
}

function formatValue(key: string, value: any): string {
  if (value === undefined || value === null || value === '') return '(kosong)';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (key === 'grandTotal' || key === 'harga' || key === 'shippingCost' || key === 'subtotal') {
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
  }
  return String(value);
}

/**
 * Generates a diff description specifically for order items changes.
 */
export function generateItemsDiff(
  beforeItems: any[],
  afterItems: any[]
): string {
  const changes: string[] = [];
  
  // Check for qty changes, added items, removed items
  const beforeMap = new Map(beforeItems.map(i => [i.sku, i]));
  const afterMap = new Map(afterItems.map(i => [i.sku, i]));

  afterMap.forEach((afterItem, sku) => {
    const beforeItem = beforeMap.get(sku);
    if (!beforeItem) {
      changes.push(`+ ${afterItem.qty}x ${sku} (baru)`);
    } else if (beforeItem.qty !== afterItem.qty) {
      changes.push(`${sku}: ${beforeItem.qty} → ${afterItem.qty} pcs`);
    }
    if (beforeItem && beforeItem.price !== afterItem.price) {
      changes.push(`Harga ${sku}: Rp ${Number(beforeItem.price).toLocaleString('id-ID')} → Rp ${Number(afterItem.price).toLocaleString('id-ID')}`);
    }
  });

  beforeMap.forEach((beforeItem, sku) => {
    if (!afterMap.has(sku)) {
      changes.push(`- ${beforeItem.qty}x ${sku} (dihapus)`);
    }
  });

  return changes.join('. ');
}

/**
 * Fire-and-forget function to write an audit log entry.
 * This should never block the main operation.
 */
export function writeAuditLog(params: AuditLogParams): void {
  const payload = {
    userId: params.userId || 'Admin',
    userName: params.userName || 'Admin',
    module: params.module,
    action: params.action,
    entityType: params.entityType || '',
    entityId: params.entityId || '',
    description: params.description,
    beforeData: params.beforeData ? JSON.stringify(params.beforeData) : '',
    afterData: params.afterData ? JSON.stringify(params.afterData) : '',
    snapshot: params.snapshot ? JSON.stringify(params.snapshot) : '',
  };

  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(e => console.error('Audit log failed:', e));
}

/**
 * Server-side audit log writer (for use in API routes).
 * Writes directly to Google Sheets without going through the API endpoint.
 */
export async function writeAuditLogServer(
  params: AuditLogParams & { sheets: any; spreadsheetId: string }
): Promise<void> {
  try {
    await params.sheets.spreadsheets.values.append({
      spreadsheetId: params.spreadsheetId,
      range: 'audit_logs!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            `LOG-${Date.now()}`,
            new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
            params.userId || 'System',
            params.userName || 'System',
            params.module,
            params.action,
            params.entityType || '',
            params.entityId || '',
            params.description,
            params.beforeData ? JSON.stringify(params.beforeData) : '',
            params.afterData ? JSON.stringify(params.afterData) : '',
            params.snapshot ? JSON.stringify(params.snapshot) : '',
          ]
        ]
      }
    });
  } catch (e) {
    console.error('Server audit log failed:', e);
  }
}
