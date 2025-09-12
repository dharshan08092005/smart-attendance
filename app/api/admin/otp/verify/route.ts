import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// POST - Verify OTP and mark attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, otp, period, date } = body;

    if (!studentId || !otp || !period || !date) {
      return NextResponse.json(
        { error: 'Student ID, OTP, period, and date are required' },
        { status: 400 }
      );
    }

    const otpCollection = await getCollection('otps');
    const studentCollection = await getCollection('recommendation');
    
    // Find the OTP
    const otpRecord = await otpCollection.findOne({
      otp,
      period,
      date,
      used: false,
      expiresAt: { $gt: Date.now() }
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await studentCollection.findOne({ 
      _id: new ObjectId(studentId) 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Mark OTP as used
    await otpCollection.updateOne(
      { _id: otpRecord._id },
      { 
        $set: { 
          used: true,
          usedBy: studentId,
          usedAt: new Date()
        }
      }
    );

    // Update student attendance (simplified - in real app, you'd have more complex logic)
    const newAttendancePercentage = Math.min(100, student.attendancePercentage + 1);
    await studentCollection.updateOne(
      { _id: new ObjectId(studentId) },
      { 
        $set: { 
          attendancePercentage: newAttendancePercentage,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        student: {
          id: student._id,
          name: student.name,
          attendancePercentage: newAttendancePercentage
        },
        otp: {
          period: otpRecord.period,
          date: otpRecord.date
        }
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
