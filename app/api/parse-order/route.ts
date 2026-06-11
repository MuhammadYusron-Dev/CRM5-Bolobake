import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { raw_text } = await request.json();

    if (!raw_text) {
      return NextResponse.json({ success: false, error: 'raw_text is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: raw_text,
      config: {
        systemInstruction: `Kamu adalah asisten parser pesanan khusus untuk toko roti Bolobake. 
Tugasmu adalah menganalisis teks percakapan kasual dan mengubahnya menjadi format JSON terstruktur untuk pesanan.
Daftar SKU yang valid dalam sistem kami mencakup kata kunci seperti: "Mochi Croissant Tiramisu", "Butter Croissant 75gr", "Butter Croissant 30gr", "Pain Au Suisse", "Almond Croissant", dll.
Gunakan pencocokan nama yang paling mendekati jika ada typo.

Format respons WAJIB berupa JSON murni dengan skema berikut:
{
  "customer_name": string atau null,
  "delivery_date": "YYYY-MM-DD" atau null,
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
