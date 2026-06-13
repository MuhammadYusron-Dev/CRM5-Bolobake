import { NextResponse } from 'next/server';
import { getAdmins } from '@/lib/google-sheets';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Harap masukkan username dan password.' }, { status: 400 });
    }

    const admins = await getAdmins();
    const admin = admins.find(a => a.username.toLowerCase() === username.toLowerCase());

    if (!admin) {
      return NextResponse.json({ success: false, message: 'Username atau password salah.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Username atau password salah.' }, { status: 401 });
    }

    // Generate token
    const token = await signToken({
      username: admin.username,
      avatarUrl: admin.avatarUrl
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
      message: 'Login berhasil.',
      user: { username: admin.username, avatarUrl: admin.avatarUrl }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
