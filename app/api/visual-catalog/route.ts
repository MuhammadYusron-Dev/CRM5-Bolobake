import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'visual-catalog.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(fileContent);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to read visual catalog data:', error);
    // Return empty array if file doesn't exist yet
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedData = await request.json();
    
    // Format JSON with 2 spaces for readability
    await fs.writeFile(dataFilePath, JSON.stringify(updatedData, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, message: 'Data successfully updated' });
  } catch (error) {
    console.error('Failed to update visual catalog data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update data' },
      { status: 500 }
    );
  }
}
