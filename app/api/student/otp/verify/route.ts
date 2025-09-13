import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// POST - Verify OTP and mark attendance
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const facultyCollection = await getCollection('faculty');
    const studentsCollection = await getCollection('recommendation');
    const body = await request.json();
    const { studentId, otp, period } = body;

    // Validate required fields
    if (!studentId || !otp || !period) {
      return NextResponse.json(
        { success: false, error: 'Student ID, OTP, and period are required' },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Find faculty with matching OTP and period
    const faculty = await facultyCollection.findOne({
      otp: otp,
      otpPeriod: period,
      otpExpiresAt: { $gt: new Date() }
    });

    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check if student is assigned to this faculty
    if (faculty.assignedStudents && !faculty.assignedStudents.some((id: any) => id.toString() === studentId)) {
      return NextResponse.json(
        { success: false, error: 'Student not assigned to this faculty' },
        { status: 403 }
      );
    }

    // Get current time for hour-based attendance
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toISOString().split('T')[0];

    // Check if student already marked attendance for this period today
    const existingAttendance = await studentsCollection.findOne({
      _id: new ObjectId(studentId),
      'attendanceRecords.date': currentDate,
      'attendanceRecords.period': period
    });

    if (existingAttendance) {
      return NextResponse.json(
        { success: false, error: 'Attendance already marked for this period' },
        { status: 400 }
      );
    }

    // Mark attendance
    const attendanceRecord = {
      date: currentDate,
      period: period,
      hour: currentHour,
      status: 'present',
      method: 'otp',
      facultyId: faculty._id,
      subjectId: faculty.otpSubjectId,
      markedAt: new Date()
    };

    // Update student attendance
    const result = await studentsCollection.updateOne(
      { _id: new ObjectId(studentId) },
      { 
        $push: { attendanceRecords: attendanceRecord },
        $inc: { attendancePercentage: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to mark attendance' },
        { status: 500 }
      );
    }

    // Clear the OTP after successful verification
    await facultyCollection.updateOne(
      { _id: faculty._id },
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

    return NextResponse.json({
      success: true,
      data: {
        studentId: studentId,
        studentName: student.name,
        period: period,
        hour: currentHour,
        date: currentDate,
        facultyName: faculty.name,
        attendanceRecord: attendanceRecord
      },
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    console.error('Student OTP Verification Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
