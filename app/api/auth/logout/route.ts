import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { writeAuditLogServer } from '@/lib/audit';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    // Extract user info before destroying the session
    let userId = 'Unknown';
    let userName = 'Unknown';
    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload) {
          userId = (payload.email || payload.username || 'Unknown') as string;
          userName = (payload.firstName ? `${payload.firstName} ${payload.lastName || ''}`.trim() : userId) as string;
        }
      } catch (e) {
        // Token might be expired, that's fine
      }
    }

    cookieStore.delete('auth_token');

    // Log logout event
    writeAuditLogServer({
      sheets, spreadsheetId: SPREADSHEET_ID,
      userId,
      userName,
      module: 'SYSTEM', action: 'LOGOUT', entityType: 'USER',
      entityId: userId,
      description: `${userName} logout dari sistem`,
    });

    return NextResponse.json({ success: true, message: 'Logout berhasil.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat logout.' }, { status: 500 });
  }
}

