import { NextResponse } from 'next/server';
import { getAdmins, updateAdminRole, sheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { roleCache } from '@/lib/lifecycle-hardening';
import { writeAuditLogServer } from '@/lib/audit';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'SUPER_ADMIN') return null;
  return payload;
}

export async function GET() {
  try {
    const adminUser = await checkSuperAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Anda bukan SUPER_ADMIN.' }, { status: 403 });
    }

    const admins = await getAdmins();
    // Filter out password hashes
    const safeAdmins = admins.map(a => ({
      email: a.email || a.username,
      firstName: a.firstName,
      lastName: a.lastName,
      avatarUrl: a.avatarUrl,
      role: a.role
    }));

    return NextResponse.json({ success: true, data: safeAdmins });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminUser = await checkSuperAdmin();
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Akses ditolak. Anda bukan SUPER_ADMIN.' }, { status: 403 });
    }

    const { email, newRole } = await request.json();
    if (!email || !newRole) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap (email atau newRole).' }, { status: 400 });
    }

    const success = await updateAdminRole(email, newRole);
    if (success) {
      // Invalidate roleCache for this user so the system picks up the new role immediately
      if (roleCache[email]) {
        delete roleCache[email];
      }

      // Write Audit Log
      writeAuditLogServer({
        sheets, spreadsheetId: SPREADSHEET_ID,
        userId: adminUser.email || adminUser.username,
        userName: adminUser.firstName ? `${adminUser.firstName} ${adminUser.lastName || ''}`.trim() : (adminUser.email || adminUser.username),
        module: 'SYSTEM',
        action: 'UPDATE',
        entityType: 'USER',
        entityId: email,
        description: `Peran pengguna ${email} diubah menjadi ${newRole}`,
        afterData: { role: newRole }
      });

      return NextResponse.json({ success: true, message: 'Jabatan berhasil diperbarui.' });
    } else {
      return NextResponse.json({ success: false, message: 'Gagal memperbarui jabatan.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
