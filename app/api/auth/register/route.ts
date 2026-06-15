import { NextResponse } from 'next/server';
import { getAdmins, addAdmin, uploadImage } from '@/lib/google-sheets';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const password = formData.get('password') as string;
    const imageFile = formData.get('image') as File | null;

    if (!email || !password || !firstName) {
      return NextResponse.json({ success: false, message: 'Harap lengkapi email, nama depan, dan password.' }, { status: 400 });
    }

    const admins = await getAdmins();
    if (admins.some(a => a.email?.toLowerCase() === email.toLowerCase() || a.username.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ success: false, message: 'Email sudah digunakan.' }, { status: 400 });
    }

    let avatarUrl = '';
    if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadImage(imageFile);
      if (uploadResult && !uploadResult.startsWith('ERROR')) {
        avatarUrl = uploadResult;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const success = await addAdmin(email, passwordHash, firstName, lastName, avatarUrl);
    if (!success) {
      throw new Error('Gagal menyimpan admin ke Google Sheets');
    }

    return NextResponse.json({ success: true, message: 'Pendaftaran berhasil. Silakan login.' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.', error: error.message }, { status: 500 });
  }
}
