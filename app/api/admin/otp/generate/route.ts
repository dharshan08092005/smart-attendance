import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// POST - Generate OTPs for attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      mode = 'single', // 'single' or 'range'
      date, 
      fromDate, 
      toDate, 
      periods = [] 
    } = body;

    if (!periods || periods.length === 0) {
      return NextResponse.json(
        { error: 'At least one period is required' },
        { status: 400 }
      );
    }

    if (mode === 'single' && !date) {
      return NextResponse.json(
        { error: 'Date is required for single mode' },
        { status: 400 }
      );
    }

    if (mode === 'range' && (!fromDate || !toDate)) {
      return NextResponse.json(
        { error: 'From date and to date are required for range mode' },
        { status: 400 }
      );
    }

    const otpCollection = await getCollection('otps');
    
    // Generate OTPs based on mode
    const otps = [];
    const now = Date.now();
    const expiryTime = now + (5 * 60 * 1000); // 5 minutes

    if (mode === 'single') {
      for (const period of periods) {
        const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        const otpData = {
          otp,
          period,
          date,
          expiresAt: expiryTime,
          createdAt: now,
          used: false,
          usedBy: null,
          usedAt: null
        };
        otps.push(otpData);
        await otpCollection.insertOne(otpData);
      }
    } else {
      // Range mode - generate OTPs for each date in range
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = d.toISOString().split('T')[0];
        for (const period of periods) {
          const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
          const otpData = {
            otp,
            period,
            date: currentDate,
            expiresAt: expiryTime,
            createdAt: now,
            used: false,
            usedBy: null,
            usedAt: null
          };
          otps.push(otpData);
          await otpCollection.insertOne(otpData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OTPs generated successfully',
      data: otps.map(otp => ({
        otp: otp.otp,
        period: otp.period,
        date: otp.date,
        expiresAt: otp.expiresAt,
        remaining: Math.max(0, Math.ceil((otp.expiresAt - now) / 1000))
      }))
    });

  } catch (error) {
    console.error('Error generating OTPs:', error);
    return NextResponse.json(
      { error: 'Failed to generate OTPs' },
      { status: 500 }
    );
  }
}
