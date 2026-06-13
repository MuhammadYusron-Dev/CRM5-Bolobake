import { NextResponse } from 'next/server';
import { getAdmins, addAdmin, uploadImage } from '@/lib/google-sheets';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const secretCode = formData.get('secretCode') as string;
    const imageFile = formData.get('image') as File | null;

    if (!username || !password || !secretCode) {
      return NextResponse.json({ success: false, message: 'Harap lengkapi semua field wajib.' }, { status: 400 });
    }

    // Verify secret code
    const expectedSecret = process.env.REGISTRATION_SECRET || 'bolobake-admin-123';
    if (secretCode !== expectedSecret) {
      return NextResponse.json({ success: false, message: 'Kode Verifikasi Rahasia salah. Akses ditolak.' }, { status: 403 });
    }

    const admins = await getAdmins();
    if (admins.some(a => a.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ success: false, message: 'Username sudah digunakan.' }, { status: 400 });
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

    const success = await addAdmin(username, passwordHash, avatarUrl);
    if (!success) {
      throw new Error('Gagal menyimpan admin ke Google Sheets');
    }

    return NextResponse.json({ success: true, message: 'Pendaftaran berhasil. Silakan login.' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.', error: error.message }, { status: 500 });
  }
}
