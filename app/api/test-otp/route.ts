import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

// GET - Test OTP generation
export async function GET(request: NextRequest) {
  try {
    // Generate 6-digit OTP (ensuring it's always 6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
    const now = Date.now();
    const expiryTime = now + (20 * 1000); // 20 seconds

    return NextResponse.json({
      success: true,
      data: {
        otp: otp,
        generatedAt: new Date(now),
        expiresAt: new Date(expiryTime),
        expiresIn: 20
      },
      message: 'Test OTP generated successfully'
    });
  } catch (error) {
    console.error('Test OTP Generation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate test OTP' },
      { status: 500 }
    );
  }
}

// POST - Test OTP generation with custom parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period = 'P1', subjectId = null } = body;

    // Generate 6-digit OTP (ensuring it's always 6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
    const now = Date.now();
    const expiryTime = now + (20 * 1000); // 20 seconds

    return NextResponse.json({
      success: true,
      data: {
        otp: otp,
        period: period,
        subjectId: subjectId,
        generatedAt: new Date(now),
        expiresAt: new Date(expiryTime),
        expiresIn: 20
      },
      message: 'Test OTP generated successfully'
    });
  } catch (error) {
    console.error('Test OTP Generation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate test OTP' },
      { status: 500 }
    );
  }
}
