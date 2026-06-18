import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'audit_logs!A2:F',
    });
    
    const rows = response.data.values || [];
    // Convert rows to objects and reverse to show newest first
    const logs = rows.map(row => ({
      log_id: row[0] || '',
      timestamp: row[1] || '',
      user_id: row[2] || '',
      user_name: row[3] || '',
      action_type: row[4] || '',
      details: row[5] || ''
    })).filter(log => log.log_id !== '').reverse();

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, details, user, userName } = await request.json();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'audit_logs!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            `LOG-${Date.now()}`,
            new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
            user || 'Admin',
            userName || 'Admin', // Ensure user_name is populated
            action,
            typeof details === 'string' ? details : JSON.stringify(details)
          ]
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to write audit log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
