import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured on Vercel.' }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const { raw_text } = await request.json();

    if (!raw_text) {
      return NextResponse.json({ success: false, error: 'raw_text is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: raw_text,
      config: {
        systemInstruction: `Kamu adalah asisten parser pesanan khusus untuk toko roti Bolobake. 
Tugasmu adalah menganalisis teks percakapan dan mengubahnya menjadi format JSON terstruktur untuk pesanan.
Customer sering menggunakan format B2B seperti:
- "ORDER B2B" / "NAMA OUTLET" -> jadikan ini nama customer
- "PESANAN / VARIAN PRODUK" -> daftar produk. Customer sering menyingkat atau membolak-balik nama (misal: "Croissant Butter", "Butter Cro", "Plain Croissant"). Cari dan petakan ke SKU terdekat. Jika customer hanya menulis "Butter Croissant" tanpa keterangan gramasi, asumsikan ukuran standarnya adalah "Butter Croissant 75gr".
- "TANGGAL PENGIRIMAN" -> Ekstrak tanggal pengiriman ke format "YYYY-MM-DD" (misal: "PENGIRIMAN HARI SENIN 15 JUNI" tahun berjalan).
- "NOTE" -> Ekstrak semua catatan tambahan yang diberikan customer.

Daftar SKU yang umum dalam sistem kami: "Butter Croissant 75gr", "Butter Croissant 30gr", "Butter Croissant 50gr", "Mochi Croissant Tiramisu", "Pain Au Suisse", "Almond Croissant", dll.
Gunakan pencocokan nama yang paling mendekati dan terstandarisasi.

Format respons WAJIB berupa JSON murni dengan skema berikut:
{
  "customer_name": string atau null,
  "delivery_date": "YYYY-MM-DD" atau null,
  "notes": string atau null,
  "items": [
    {
      "detected_sku": string,
      "qty": number
    }
  ]
}
Jangan berikan teks penjelasan apa pun di luar JSON tersebut, jangan gunakan markdown code blocks, hanya teks JSON mentah.`,
        temperature: 0.1,
      }
    });

    const textResponse = response.text || '';
    // Clean up if model mistakenly returned markdown code block
    const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsedJson = JSON.parse(cleanedText);
      return NextResponse.json({ success: true, data: parsedJson });
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", cleanedText);
      return NextResponse.json({ success: false, error: 'AI failed to generate valid JSON' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Failed to parse order with Gemini:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
