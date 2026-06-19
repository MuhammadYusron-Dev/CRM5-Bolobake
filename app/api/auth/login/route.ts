import { NextResponse } from 'next/server';
import { getAdmins, sheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { writeAuditLogServer } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Harap masukkan email dan password.' }, { status: 400 });
    }

    const admins = await getAdmins();
    const admin = admins.find(a => (a.email?.toLowerCase() === email.toLowerCase()) || (a.username?.toLowerCase() === email.toLowerCase()));

    if (!admin) {
      // Log failed login
      writeAuditLogServer({
        sheets, spreadsheetId: SPREADSHEET_ID,
        module: 'SYSTEM', action: 'FAILED_LOGIN', entityType: 'USER',
        description: `Percobaan login gagal untuk akun: ${email}`,
        afterData: { email },
      });
      return NextResponse.json({ success: false, message: 'Email atau password salah.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      // Log failed login
      writeAuditLogServer({
        sheets, spreadsheetId: SPREADSHEET_ID,
        module: 'SYSTEM', action: 'FAILED_LOGIN', entityType: 'USER',
        description: `Percobaan login gagal (password salah) untuk akun: ${email}`,
        afterData: { email },
      });
      return NextResponse.json({ success: false, message: 'Email atau password salah.' }, { status: 401 });
    }

    // Generate token
    const token = await signToken({
      username: admin.email || admin.username, // keep username claim for backwards compatibility in other routes
      email: admin.email || admin.username,
      firstName: admin.firstName,
      lastName: admin.lastName,
      avatarUrl: admin.avatarUrl,
      role: 'WORKSPACE',
      issuedAt: new Date().toISOString()
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Log successful login
    const displayName = admin.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : (admin.email || admin.username);
    writeAuditLogServer({
      sheets, spreadsheetId: SPREADSHEET_ID,
      userId: admin.email || admin.username,
      userName: displayName,
      module: 'SYSTEM', action: 'LOGIN', entityType: 'USER',
      entityId: admin.email || admin.username,
      description: `${displayName} berhasil login ke sistem`,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Login berhasil.',
      user: { username: admin.email || admin.username, email: admin.email, firstName: admin.firstName, lastName: admin.lastName, avatarUrl: admin.avatarUrl, role: admin.role }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
