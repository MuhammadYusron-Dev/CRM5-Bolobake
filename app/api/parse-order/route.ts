import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured on Vercel.' }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const { raw_text, valid_skus } = await request.json();

    if (!raw_text) {
      return NextResponse.json({ success: false, error: 'raw_text is required' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const skuListString = Array.isArray(valid_skus) && valid_skus.length > 0 
      ? valid_skus.join(', ')
      : '"Butter Croissant 75gr", "Butter Croissant 30gr", "Butter Croissant 50gr", "Mochi Croissant Tiramisu", "Pain Au Suisse", "Almond Croissant", dll.';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: raw_text,
      config: {
        systemInstruction: `Kamu adalah asisten parser pesanan khusus untuk toko roti Bolobake. 
Tugasmu adalah menganalisis teks percakapan dan mengubahnya menjadi format JSON terstruktur untuk pesanan.
Customer sering menggunakan format B2B seperti:
- "ORDER B2B" / "NAMA OUTLET" -> jadikan ini nama customer
- "PESANAN / VARIAN PRODUK" -> daftar produk. Customer sering menyingkat atau membolak-balik nama (misal: "Croissant Butter", "Butter Cro", "Plain Croissant"). Cari dan petakan ke SKU terdekat. Jika customer hanya menulis "Butter Croissant" tanpa keterangan gramasi, asumsikan ukuran standarnya adalah "Butter Croissant 75gr".
- "TANGGAL PENGIRIMAN" -> Ekstrak tanggal pengiriman ke format "YYYY-MM-DD" (misal: "PENGIRIMAN HARI SENIN 15 JUNI"). WAJIB gunakan tahun sekarang yaitu ${currentYear}. DILARANG menggunakan tahun lalu atau masa depan.
- "OPSI DELIVERY" -> Analisis kalimat pengiriman dan note untuk menentukan opsi pengiriman:
  * "BUDIMAS TW" -> delivery_option: "BUDIMAS", delivery_route: "Tawangmangu"
  * "BUDIMAS BYL" -> delivery_option: "BUDIMAS", delivery_route: "Boyolali"
  * "BUDIMAS WNG" -> delivery_option: "BUDIMAS", delivery_route: "Wonogiri"
  * Hanya tanggal (misal "PENGIRIMAN HARI SENIN") -> delivery_option: "BOLOBAKE", is_free_shipping: true
  * Tanggal + NOTE "EKSPEDISI KALOG/PAXEL" -> delivery_option: "EKSPEDISI", delivery_route: "KALOG" (atau PAXEL), is_free_shipping: false
  * "DIAMBIL DI CENTRAL/BOLOBAKE" tanpa note ekspedisi -> delivery_option: "SELF PICKUP", is_free_shipping: true. Teks "DIAMBIL DI..." masukkan ke notes.
  * "DIAMBIL DI CENTRAL" + NOTE "EKSPEDISI TRAVEL" -> delivery_option: "EKSPEDISI TRAVEL", is_free_shipping: false.
- "NOTE" -> Ekstrak semua catatan tambahan yang diberikan customer, digabung dengan teks self pickup jika ada.

Daftar SKU RESMI dalam sistem kami saat ini: ${skuListString}
Kamu WAJIB menggunakan NAMA SKU YANG SAMA PERSIS dengan salah satu yang ada di daftar SKU RESMI di atas pada kolom "detected_sku". Jangan mengarang nama baru. Jika customer mengetik "Pain Au Chocolat" pastikan itu ada di daftar, atau sesuaikan ke nama persisnya di daftar. Jika tidak ada yang cocok, gunakan nama terdekat.

Format respons WAJIB berupa JSON murni dengan skema berikut:
{
  "customer_name": string atau null,
  "delivery_date": "YYYY-MM-DD" atau null,
  "delivery_option": "BUDIMAS" | "BOLOBAKE" | "EKSPEDISI" | "EKSPEDISI TRAVEL" | "SELF PICKUP" atau null,
  "delivery_route": "Tawangmangu" | "Boyolali" | "Wonogiri" | "KALOG" | "PAXEL" atau null,
  "is_free_shipping": boolean (default true jika tidak ada info berbayar),
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
