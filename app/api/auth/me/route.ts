import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, signToken } from '@/lib/jwt';
import { updateAdmin, uploadImage } from '@/lib/google-sheets';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { username: payload.username, avatarUrl: payload.avatarUrl } 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const formData = await request.formData();
    const password = formData.get('password') as string;
    const avatarFile = formData.get('avatarFile') as File | null;

    let newPasswordHash;
    if (password) {
      newPasswordHash = await bcrypt.hash(password, 10);
    }

    let finalAvatarUrl;
    if (avatarFile && avatarFile.size > 0) {
      const uploadedUrl = await uploadImage(avatarFile);
      if (uploadedUrl && !uploadedUrl.startsWith('ERROR')) {
        finalAvatarUrl = uploadedUrl;
      } else {
        return NextResponse.json({ success: false, message: 'Gagal mengunggah foto profil' }, { status: 500 });
      }
    }

    const success = await updateAdmin(payload.username, newPasswordHash, finalAvatarUrl);
    if (!success) {
      return NextResponse.json({ success: false, message: 'Gagal update profil' }, { status: 500 });
    }

    // Sign new token with potentially new avatar
    const newToken = await signToken({
      username: payload.username,
      avatarUrl: finalAvatarUrl !== undefined ? finalAvatarUrl : payload.avatarUrl
    });

    cookieStore.set({
      name: 'auth_token',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return NextResponse.json({ 
      success: true, 
      user: { username: payload.username, avatarUrl: finalAvatarUrl !== undefined ? finalAvatarUrl : payload.avatarUrl } 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
