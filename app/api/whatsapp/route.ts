import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message, token } = body;

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: 'Phone and message are required' }, { status: 400 });
    }

    // Format phone number to 628...
    let targetPhone = phone.replace(/\D/g, '');
    if (targetPhone.startsWith('0')) {
      targetPhone = '62' + targetPhone.substring(1);
    }

    // SIMULATOR MODE (FREE)
    if (!token || token === 'SIMULATOR') {
      // Simulate network delay (500ms to 1.5s)
      const delay = Math.floor(Math.random() * 1000) + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return NextResponse.json({ 
        success: true, 
        simulated: true, 
        message: 'Pesan pura-pura berhasil dikirim (Simulator)',
        target: targetPhone
      });
    }

    // REAL MODE (E.g., Fonnte API)
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token, // Fonnte API Token
      },
      body: new URLSearchParams({
        target: targetPhone,
        message: message,
        countryCode: '62', // Optional
      }),
    });

    const data = await response.json();
    
    if (data.status) {
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({ success: false, error: data.reason || 'Failed to send' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('WhatsApp API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
