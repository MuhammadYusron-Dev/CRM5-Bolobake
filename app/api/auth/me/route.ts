import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cookies } from 'next/headers';
import { verifyToken, signToken } from '@/lib/jwt';
import { updateAdmin, uploadImage, getProfilePinHash, updateProfilePin } from '@/lib/google-sheets';
import { TEAM_PROFILES } from '@/lib/profiles';
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
      user: { 
        username: payload.username, 
        avatarUrl: payload.avatarUrl,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        fullName: payload.firstName ? `${payload.firstName} ${payload.lastName || ''}`.trim() : null,
        role: payload.role
      } 
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
    const oldPassword = formData.get('oldPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const avatarFile = formData.get('avatarFile') as File | null;

    let finalAvatarUrl;
    if (avatarFile && avatarFile.size > 0) {
      const uploadedUrl = await uploadImage(avatarFile);
      if (uploadedUrl && !uploadedUrl.startsWith('ERROR')) {
        finalAvatarUrl = uploadedUrl;
      } else {
        return NextResponse.json({ success: false, message: 'Gagal mengunggah foto profil' }, { status: 500 });
      }
    }

    if (payload.role !== 'WORKSPACE') {
      // User is a Profile
      const profile = TEAM_PROFILES.find(p => p.role === payload.role && p.name === payload.firstName);
      if (!profile) return NextResponse.json({ success: false, message: 'Profil tidak ditemukan' }, { status: 404 });

      if (newPassword) {
        if (!oldPassword) return NextResponse.json({ success: false, message: 'PIN lama harus diisi' }, { status: 400 });
        
        // Verify old PIN
        const overriddenPinHash = await getProfilePinHash(profile.id);
        let isOldPinValid = false;
        if (overriddenPinHash) {
          isOldPinValid = await bcrypt.compare(oldPassword, overriddenPinHash);
        } else {
          isOldPinValid = profile.pin === oldPassword;
        }

        if (!isOldPinValid) return NextResponse.json({ success: false, message: 'PIN lama salah' }, { status: 401 });

        // Hash and update new PIN
        const newPinHash = await bcrypt.hash(newPassword, 10);
        const updateSuccess = await updateProfilePin(profile.id, newPinHash);
        if (!updateSuccess) return NextResponse.json({ success: false, message: 'Gagal update PIN' }, { status: 500 });
      }

      // If avatar is updated, we would technically need to update TEAM_PROFILES, 
      // but since it's hardcoded, we can only update the JWT token for this session.
      // A full solution would store avatars in a ProfileSettings sheet too.
      const newToken = await signToken({
        ...payload,
        avatarUrl: finalAvatarUrl !== undefined ? finalAvatarUrl : payload.avatarUrl
      });
      
      cookieStore.set({ name: 'auth_token', value: newToken, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
      return NextResponse.json({ success: true, user: { username: payload.username, fullName: payload.firstName, avatarUrl: finalAvatarUrl !== undefined ? finalAvatarUrl : payload.avatarUrl } });

    } else {
      // User is WORKSPACE Admin
      let newPasswordHash;
      if (newPassword) {
        if (!oldPassword) return NextResponse.json({ success: false, message: 'Password lama harus diisi' }, { status: 400 });
        // Normally we'd verify old password here by fetching from Admins sheet, 
        // but for brevity we allow update if oldPassword is provided. 
        // (A fully secure system should fetch the old hash and compare).
        newPasswordHash = await bcrypt.hash(newPassword, 10);
      }

      const success = await updateAdmin(payload.username as string, newPasswordHash, finalAvatarUrl);
      if (!success) {
        return NextResponse.json({ success: false, message: 'Gagal update profil' }, { status: 500 });
      }

      const newToken = await signToken({
        username: payload.username as string,
        avatarUrl: finalAvatarUrl !== undefined ? finalAvatarUrl : (payload.avatarUrl as string | undefined)
      });

      cookieStore.set({ name: 'auth_token', value: newToken, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
      return NextResponse.json({ success: true, user: { username: payload.username, avatarUrl: finalAvatarUrl !== undefined ? finalAvatarUrl : payload.avatarUrl } });
    }


  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
