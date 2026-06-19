import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { getAdmins, addAdmin } from '@/lib/google-sheets';
import { signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 400 });
    }

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ success: false, message: 'Gagal memverifikasi akun Google.' }, { status: 401 });
    }

    const { email, given_name, family_name, picture } = payload;
    
    const admins = await getAdmins();
    let admin = admins.find(a => a.email?.toLowerCase() === email.toLowerCase() || a.username?.toLowerCase() === email.toLowerCase());

    if (!admin) {
      // Auto register the user with Google
      // Generate a random password since they login via Google
      const randomPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);
      
      const success = await addAdmin(email, passwordHash, given_name || '', family_name || '', picture || '');
      if (!success) {
        throw new Error('Gagal menyimpan admin baru ke Google Sheets');
      }
      
      admin = {
        email: email,
        username: email,
        passwordHash: passwordHash,
        firstName: given_name || '',
        lastName: family_name || '',
        avatarUrl: picture || ''
      };
    }

    // Generate token
    const token = await signToken({
      username: admin.email || admin.username,
      email: admin.email || admin.username,
      firstName: admin.firstName,
      lastName: admin.lastName,
      avatarUrl: admin.avatarUrl || picture,
      role: 'WORKSPACE'
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

    return NextResponse.json({ 
      success: true, 
      message: 'Login dengan Google berhasil.',
      user: { username: admin.email || admin.username, email: admin.email, firstName: admin.firstName, lastName: admin.lastName, avatarUrl: admin.avatarUrl || picture }
    });
  } catch (error: any) {
    console.error('Google Auth error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan saat verifikasi Google.' }, { status: 500 });
  }
}
