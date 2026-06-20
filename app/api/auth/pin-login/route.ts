import { NextResponse } from 'next/server';
import { TEAM_PROFILES } from '@/lib/profiles';
import { signToken, verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { getAdmins } from '@/lib/google-sheets';

export async function POST(request: Request) {
  try {
    const { profileId, pin } = await request.json();

    if (!profileId || !pin) {
      return NextResponse.json({ success: false, message: 'Harap masukkan PIN.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Akses Workspace tidak ditemukan. Silakan login kembali.' }, { status: 401 });
    }

    // Verify token validity
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 403 });
    }

    const profile = TEAM_PROFILES.find(p => p.id === profileId);
    
    if (!profile) {
      return NextResponse.json({ success: false, message: 'Profil tidak ditemukan.' }, { status: 404 });
    }

    if (profile.pin !== pin) {
      return NextResponse.json({ success: false, message: 'PIN salah.' }, { status: 401 });
    }

    // Generate final token
    // We retain the email/username from Google Workspace auth, but assign the Profile's identity
    const finalToken = await signToken({
      username: payload.username,
      email: payload.email,
      firstName: profile.name,
      lastName: '',
      avatarUrl: profile.avatar,
      role: profile.role,
      issuedAt: new Date().toISOString()
    });

    // Set new cookie
    cookieStore.set({
      name: 'auth_token',
      value: finalToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Login berhasil.',
    });
  } catch (error: any) {
    console.error('PIN Login error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
