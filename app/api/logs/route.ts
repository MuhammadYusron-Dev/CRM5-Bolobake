import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function POST(request: Request) {
  try {
    const { action, details, user } = await request.json();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'audit_logs!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            `LOG-${Date.now()}`,
            new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
            user || 'Admin',
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
