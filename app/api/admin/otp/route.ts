import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { periods, date, mode, fromDate, toDate } = body;

    if (!periods || periods.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one period is required' },
        { status: 400 }
      );
    }

    const otps = [];
    const now = Date.now();
    const expiryTime = 5 * 60 * 1000; // 5 minutes

    for (const period of periods) {
      const otp = Math.random().toString(36).substring(2, 8).toUpperCase();
      const otpData = {
        period,
        otp,
        date: mode === 'single' ? date : fromDate,
        expiresAt: now + expiryTime,
        remaining: 300, // 5 minutes in seconds
        showQR: true
      };
      otps.push(otpData);
    }

    // In a real implementation, you would save these OTPs to the database
    // and associate them with specific sessions/classes

    return NextResponse.json({
      success: true,
      data: otps,
      message: 'OTPs generated successfully'
    });
  } catch (error) {
    console.error('OTP Generation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate OTPs' },
      { status: 500 }
    );
  }
}
