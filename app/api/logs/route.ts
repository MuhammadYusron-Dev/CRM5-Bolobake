import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'audit_logs!A2:L',
    });
    
    const rows = response.data.values || [];
    const logs = rows.map(row => ({
      log_id: row[0] || '',
      timestamp: row[1] || '',
      user_id: row[2] || '',
      user_name: row[3] || '',
      // Support both v1 (6-col) and v2 (12-col) format
      module: row[4] || '',
      action: row[5] || '',
      entity_type: row[6] || '',
      entity_id: row[7] || '',
      description: row[8] || '',
      before_data: row[9] || '',
      after_data: row[10] || '',
      snapshot: row[11] || '',
      // Legacy compatibility: if module looks like an action_type (v1 data),
      // remap for the UI
      _is_legacy: !row[6] && !row[8],
    })).filter(log => log.log_id !== '').reverse();

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support both old format (action/details) and new format (module/action/...)
    const isNewFormat = body.module !== undefined;

    let values: string[];

    if (isNewFormat) {
      values = [
        `LOG-${Date.now()}`,
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        body.userId || body.user || 'Admin',
        body.userName || 'Admin',
        body.module || '',
        body.action || '',
        body.entityType || '',
        body.entityId || '',
        body.description || '',
        typeof body.beforeData === 'string' ? body.beforeData : (body.beforeData ? JSON.stringify(body.beforeData) : ''),
        typeof body.afterData === 'string' ? body.afterData : (body.afterData ? JSON.stringify(body.afterData) : ''),
        typeof body.snapshot === 'string' ? body.snapshot : (body.snapshot ? JSON.stringify(body.snapshot) : ''),
      ];
    } else {
      // Legacy v1 format support
      values = [
        `LOG-${Date.now()}`,
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        body.user || 'Admin',
        body.userName || 'Admin',
        '', // module
        body.action || '',
        '', // entity_type
        '', // entity_id
        '', // description
        '', // before_data
        '', // after_data
        typeof body.details === 'string' ? body.details : JSON.stringify(body.details),
      ];
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'audit_logs!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to write audit log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
