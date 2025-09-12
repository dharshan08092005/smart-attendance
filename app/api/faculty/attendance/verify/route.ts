import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// POST - Verify student attendance via OTP/QR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, otp, sessionId, facultyId } = body;

    if (!studentId || !otp || !sessionId || !facultyId) {
      return NextResponse.json(
        { error: 'Student ID, OTP, session ID, and faculty ID are required' },
        { status: 400 }
      );
    }

    const otpCollection = await getCollection('otps');
    const studentCollection = await getCollection('recommendation');
    const attendanceCollection = await getCollection('attendance');
    
    // Find valid OTP
    const otpRecord = await otpCollection.findOne({
      otp,
      sessionId,
      facultyId: new ObjectId(facultyId),
      used: false,
      expiresAt: { $gt: Date.now() }
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Verify student belongs to faculty
    const student = await studentCollection.findOne({ 
      _id: new ObjectId(studentId),
      facultyId: new ObjectId(facultyId)
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Check if already marked for this session
    const existingAttendance = await attendanceCollection.findOne({
      studentId: new ObjectId(studentId),
      sessionId,
      facultyId: new ObjectId(facultyId)
    });

    if (existingAttendance) {
      return NextResponse.json({
        success: true,
        message: 'Attendance already marked',
        data: {
          student: {
            id: student._id,
            name: student.name,
            registrationNumber: student.registrationNumber
          },
          alreadyMarked: true
        }
      });
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

    // Create attendance record
    const attendanceRecord = {
      studentId: new ObjectId(studentId),
      facultyId: new ObjectId(facultyId),
      sessionId,
      otp,
      status: 'present',
      method: 'otp',
      markedAt: new Date(),
      createdAt: new Date()
    };

    await attendanceCollection.insertOne(attendanceRecord);

    // Update student attendance percentage
    const totalAttendance = await attendanceCollection.countDocuments({
      studentId: new ObjectId(studentId),
      status: 'present'
    });

    const totalSessions = await attendanceCollection.countDocuments({
      studentId: new ObjectId(studentId)
    });

    const newAttendancePercentage = totalSessions > 0 ? Math.round((totalAttendance / totalSessions) * 100) : 100;

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
          registrationNumber: student.registrationNumber,
          attendancePercentage: newAttendancePercentage
        },
        sessionId,
        markedAt: attendanceRecord.markedAt
      }
    });

  } catch (error) {
    console.error('Error verifying attendance:', error);
    return NextResponse.json(
      { error: 'Failed to verify attendance' },
      { status: 500 }
    );
  }
}
