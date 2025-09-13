import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// POST - Generate OTP for faculty (Admin function)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const facultyCollection = await getCollection('faculty');
    const body = await request.json();
    const { facultyId, period, subjectId } = body;

    console.log('Admin OTP Generation Request:', { facultyId, period, subjectId });

    // Validate required fields
    if (!facultyId || !period) {
      console.log('Validation failed:', { facultyId: !!facultyId, period: !!period });
      return NextResponse.json(
        { success: false, error: 'Faculty ID and period are required' },
        { status: 400 }
      );
    }

    // Validate facultyId format
    if (!ObjectId.isValid(facultyId)) {
      console.log('Invalid facultyId format:', facultyId);
      return NextResponse.json(
        { success: false, error: 'Invalid faculty ID format' },
        { status: 400 }
      );
    }

    // Check if faculty exists
    const faculty = await facultyCollection.findOne({ _id: new ObjectId(facultyId) });
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP (ensuring it's always 6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
    const now = Date.now();
    const expiryTime = now + (20 * 1000); // 20 seconds

    // Update faculty with OTP
    const result = await facultyCollection.updateOne(
      { _id: new ObjectId(facultyId) },
      { 
        $set: { 
          otp: otp,
          otpGeneratedAt: new Date(now),
          otpExpiresAt: new Date(expiryTime),
          otpPeriod: period,
          otpSubjectId: subjectId ? new ObjectId(subjectId) : null
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate OTP' },
        { status: 500 }
      );
    }

    // Schedule OTP cleanup after 20 seconds
    setTimeout(async () => {
      try {
        await facultyCollection.updateOne(
          { _id: new ObjectId(facultyId) },
          { 
            $unset: { 
              otp: "",
              otpGeneratedAt: "",
              otpExpiresAt: "",
              otpPeriod: "",
              otpSubjectId: ""
            }
          }
        );
      } catch (error) {
        console.error('Error cleaning up OTP:', error);
      }
    }, 20000);

    return NextResponse.json({
      success: true,
      data: {
        otp: otp,
        facultyId: facultyId,
        facultyName: faculty.name,
        period: period,
        expiresIn: 20,
        generatedAt: new Date(now)
      },
      message: 'OTP generated successfully for faculty'
    });
  } catch (error) {
    console.error('Admin Faculty OTP Generation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate OTP' },
      { status: 500 }
    );
  }
}
