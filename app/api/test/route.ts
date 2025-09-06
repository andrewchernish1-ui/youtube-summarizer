import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('Test API called');
  return NextResponse.json({
    message: 'Test API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  console.log('Test API POST called');
  return NextResponse.json({
    message: 'Test API POST is working',
    timestamp: new Date().toISOString()
  });
}
