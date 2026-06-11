import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Supported MIME types for upload
const SUPPORTED_TYPES: Record<string, string> = {
  'application/pdf': 'application/pdf',
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/webp': 'image/webp',
};

const INLINE_LIMIT = 15 * 1024 * 1024; // 15MB — use inline base64 for smaller files
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB absolute max

// Prompt for Gemini to extract catalog items
const EXTRACTION_PROMPT = `Kamu adalah asisten yang ahli dalam membaca katalog menu bakery/toko roti.

Analisis file katalog ini dan ekstrak SEMUA item produk yang ada.

Untuk setiap produk, identifikasi:
1. **nama**: Nama lengkap produk termasuk varian/ukuran (contoh: "Butter Croissant 50gr", "CROMBOLONI Tiramisu")
2. **kategori**: Kategori produk. Pilih dari: Croissant, Cromboloni, Croffle, Pastry, Bagel, Bread, Salt Bread, Sweets, Cake, Cookies, Dessert, Snack, Quiche, atau kategori lain yang sesuai.
3. **harga**: Harga dalam Rupiah (angka saja tanpa "Rp" atau titik, contoh: 15000)

ATURAN PENTING:
- Ekstrak SEMUA produk yang terlihat, jangan ada yang terlewat
- Jika harga tidak terlihat jelas atau tidak ada, isi dengan 0
- Jika ada beberapa varian ukuran (30gr, 50gr, 75gr), buat sebagai item TERPISAH
- Pastikan nama produk ditulis persis seperti di katalog
- Jangan mengarang produk yang tidak ada di file

Berikan response dalam format JSON array:
[
  {"nama": "Nama Produk", "kategori": "Kategori", "harga": 15000},
  ...
]

HANYA berikan JSON array, tanpa teks tambahan lainnya.`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY belum dikonfigurasi. Dapatkan API key gratis di https://aistudio.google.com/apikey' },
        { status: 500 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    // Validate file type
    const mimeType = SUPPORTED_TYPES[file.type];
    if (!mimeType) {
      return NextResponse.json(
        { success: false, error: `Format file "${file.type}" tidak didukung. Gunakan PDF, PNG, JPG, atau WebP.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file melebihi batas 100MB.' },
        { status: 400 }
      );
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey });

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Build the file part depending on size
    let filePart: any;

    if (file.size <= INLINE_LIMIT) {
      // Small files: use inline base64 (faster, no upload step)
      filePart = {
        inlineData: {
          mimeType: mimeType,
          data: fileBuffer.toString('base64'),
        },
      };
    } else {
      // Large files: use Gemini Files API (upload first, then reference)
      const uploadedFile = await ai.files.upload({
        file: new Blob([fileBuffer], { type: mimeType }),
        config: {
          mimeType: mimeType,
          displayName: file.name,
        },
      });

      // Wait for the file to be processed
      let fileState = uploadedFile.state;
      let fileRef = uploadedFile;

      while (fileState === 'PROCESSING') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const status = await ai.files.get({ name: fileRef.name! });
        fileState = status.state;
        fileRef = status;
      }

      if (fileState === 'FAILED') {
        return NextResponse.json(
          { success: false, error: 'Gemini gagal memproses file. Coba upload ulang.' },
          { status: 500 }
        );
      }

      filePart = {
        fileData: {
          fileUri: fileRef.uri,
          mimeType: mimeType,
        },
      };
    }

    // Send to Gemini for structured extraction
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            filePart,
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    // Parse the response
    const responseText = response.text || '';
    
    let parsedItems: Array<{ nama: string; kategori: string; harga: number }> = [];
    
    try {
      parsedItems = JSON.parse(responseText);
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedItems = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { success: false, error: 'AI gagal mengekstrak data dalam format yang benar. Coba upload ulang.' },
          { status: 500 }
        );
      }
    }

    // Validate and clean the parsed items
    const cleanedItems = parsedItems
      .filter((item) => item.nama && typeof item.nama === 'string' && item.nama.trim() !== '')
      .map((item, index) => ({
        id: index + 1,
        nama: item.nama.trim(),
        kategori: item.kategori?.trim() || 'General',
        harga: Math.max(0, Math.round(Number(item.harga) || 0)),
        confirmed: false,
      }));

    if (cleanedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ditemukan produk dalam file. Pastikan file berisi katalog menu.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cleanedItems,
      message: `Berhasil mendeteksi ${cleanedItems.length} produk dari "${file.name}"`,
    });
  } catch (error: any) {
    console.error('Scan catalog error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat memproses file.' },
      { status: 500 }
    );
  }
}
