import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// POST - Generate OTP and QR for faculty attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      facultyId,
      sessionId,
      ttlSeconds = 300 // 5 minutes default
    } = body;

    if (!facultyId || !sessionId) {
      return NextResponse.json(
        { error: 'Faculty ID and session ID are required' },
        { status: 400 }
      );
    }

    const facultyCollection = await getCollection('faculty');
    const otpCollection = await getCollection('otps');
    
    // Verify faculty exists
    const faculty = await facultyCollection.findOne({ 
      _id: new ObjectId(facultyId) 
    });

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
    const now = Date.now();
    const expiresAt = now + (ttlSeconds * 1000);

    // Create OTP record
    const otpData = {
      otp,
      sessionId,
      facultyId: new ObjectId(facultyId),
      expiresAt,
      createdAt: now,
      used: false,
      usedBy: null,
      usedAt: null
    };

    await otpCollection.insertOne(otpData);

    // Create signed QR payload
    const payload = {
      v: 1,
      sessionId,
      otp,
      exp: Math.floor(expiresAt / 1000),
      iat: Math.floor(now / 1000),
      facultyId: facultyId,
      sig: generateSignature(sessionId, otp, expiresAt, now, facultyId)
    };

    return NextResponse.json({
      success: true,
      message: 'OTP generated successfully',
      data: {
        otp,
        sessionId,
        expiresAt,
        payload
      }
    });

  } catch (error) {
    console.error('Error generating OTP:', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP' },
      { status: 500 }
    );
  }
}

// Helper function to generate signature
function generateSignature(sessionId: string, otp: string, expiresAt: number, issuedAt: number, facultyId: string): string {
  const secret = process.env.QR_HMAC_SECRET || 'dev-secret-change-me';
  const toSign = `${sessionId}|${otp}|${Math.floor(expiresAt / 1000)}|${Math.floor(issuedAt / 1000)}|${facultyId}|v1`;
  return crypto.createHmac('sha256', secret).update(toSign).digest('hex');
}
