import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

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

    const currentDateObj = new Date();
    const currentMonth = currentDateObj.toLocaleString('id-ID', { month: 'long' });
    const currentYear = currentDateObj.getFullYear();
    const skuListString = Array.isArray(valid_skus) && valid_skus.length > 0 
      ? valid_skus.join(', ')
      : '"Butter Croissant 75gr", "Butter Croissant 30gr", "Butter Croissant 50gr", "Mochi Croissant Tiramisu", "Pain Au Suisse", "Almond Croissant", dll.';

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        customer_name: { type: Type.STRING, nullable: true },
        delivery_date: { type: Type.STRING, description: "Format YYYY-MM-DD", nullable: true },
        delivery_option: { type: Type.STRING, nullable: true, description: "Salah satu dari: BUDIMAS, BOLOBAKE, EKSPEDISI, EKSPEDISI TRAVEL, SELF PICKUP" },
        delivery_route: { type: Type.STRING, nullable: true, description: "Salah satu dari: Tawangmangu, Boyolali, Wonogiri, KALOG, PAXEL" },
        is_free_shipping: { type: Type.BOOLEAN, description: "Default true jika tidak ada info berbayar" },
        notes: { type: Type.STRING, nullable: true },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              detected_sku: { type: Type.STRING },
              qty: { type: Type.NUMBER }
            },
            required: ["detected_sku", "qty"]
          }
        }
      },
      required: ["is_free_shipping", "items"]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: raw_text,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: `Kamu adalah asisten parser pesanan khusus untuk toko roti Bolobake. 
Tugasmu adalah menganalisis teks percakapan dan mengubahnya menjadi format JSON terstruktur untuk pesanan.

PENTING - KONTEKS WAKTU:
Hari ini adalah bulan ${currentMonth} tahun ${currentYear}. 
Saat menentukan tanggal pengiriman, SELALU prioritaskan bulan dan tahun saat ini (${currentMonth} ${currentYear}) jika pelanggan tidak menyebutkan bulan/tahun secara spesifik. DILARANG KERAS menyetel bulan atau tahun yang terlalu jauh ke depan/belakang tanpa indikasi yang jelas.

Customer sering menggunakan format B2B seperti:
- "ORDER B2B" / "NAMA OUTLET" -> jadikan ini nama customer (customer_name)
- "PESANAN / VARIAN PRODUK" -> daftar produk. Customer sering menyingkat (misal: "Croissant Butter", "Butter Cro", "Plain Croissant"). Cari dan petakan ke SKU terdekat dari daftar SKU RESMI. Jika customer hanya menulis "Butter Croissant" tanpa gramasi, asumsikan "Butter Croissant 75gr".
- "TANGGAL PENGIRIMAN" -> Ekstrak tanggal pengiriman ke format "YYYY-MM-DD" (delivery_date).
- "OPSI DELIVERY" -> Analisis kalimat pengiriman dan note:
  * "BUDIMAS TW" -> delivery_option: "BUDIMAS", delivery_route: "Tawangmangu"
  * "BUDIMAS BYL" -> delivery_option: "BUDIMAS", delivery_route: "Boyolali"
  * "BUDIMAS WNG" -> delivery_option: "BUDIMAS", delivery_route: "Wonogiri"
  * Hanya tanggal (misal "PENGIRIMAN HARI SENIN") -> delivery_option: "BOLOBAKE", is_free_shipping: true
  * Tanggal + NOTE "EKSPEDISI KALOG/PAXEL" -> delivery_option: "EKSPEDISI", delivery_route: "KALOG" (atau PAXEL), is_free_shipping: false
  * "DIAMBIL DI CENTRAL/BOLOBAKE" tanpa note ekspedisi -> delivery_option: "SELF PICKUP", is_free_shipping: true. Teks "DIAMBIL DI..." masukkan ke notes.
  * "DIAMBIL DI CENTRAL" + NOTE "EKSPEDISI TRAVEL" -> delivery_option: "EKSPEDISI TRAVEL", is_free_shipping: false.
- "NOTE" -> Ekstrak semua catatan tambahan yang diberikan customer, digabung dengan teks self pickup jika ada.

Daftar SKU RESMI dalam sistem kami saat ini: ${skuListString}
Kamu WAJIB menggunakan NAMA SKU YANG SAMA PERSIS dengan salah satu yang ada di daftar SKU RESMI pada kolom "detected_sku". Jangan mengarang nama baru. Jika tidak ada yang sama persis, gunakan nama terdekat dari daftar.`,
        temperature: 0.1,
      }
    });

    const textResponse = response.text || '';
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", textResponse);
      return NextResponse.json({ success: false, error: 'AI failed to generate valid JSON' }, { status: 500 });
    }

    // Server-side Date Math Logic untuk Production Date (H-1 / H-2)
    if (parsedJson.delivery_date) {
      // Set default production_date sama dengan delivery_date
      parsedJson.production_date = parsedJson.delivery_date;
      
      const deliveryDateObj = new Date(parsedJson.delivery_date);
      if (!isNaN(deliveryDateObj.getTime()) && parsedJson.delivery_option === 'BUDIMAS') {
        const prodDate = new Date(deliveryDateObj);
        if (parsedJson.delivery_route === 'Wonogiri') {
          // Wonogiri H-2
          prodDate.setDate(prodDate.getDate() - 2);
          parsedJson.production_date = prodDate.toISOString().split('T')[0];
        } else if (parsedJson.delivery_route === 'Boyolali' || parsedJson.delivery_route === 'Tawangmangu') {
          // Boyolali & Tawangmangu H-1
          prodDate.setDate(prodDate.getDate() - 1);
          parsedJson.production_date = prodDate.toISOString().split('T')[0];
        }
      }
    } else {
      parsedJson.production_date = null;
    }

    return NextResponse.json({ success: true, data: parsedJson });

  } catch (error: any) {
    console.error('Failed to parse order with Gemini:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
