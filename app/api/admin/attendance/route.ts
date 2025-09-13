import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const studentsCollection = await getCollection('recommendation');
    const body = await request.json();
    const { 
      studentId, 
      date, 
      hour, 
      status, 
      method, 
      subjectId, 
      classSessionId,
      mode,
      fromDate,
      toDate,
      periods
    } = body;

    if (mode === 'bulk') {
      return await handleBulkAttendance(body);
    }

    // Single attendance record
    if (!studentId || !date || !hour || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for attendance' },
        { status: 400 }
      );
    }

    // Find student
    const student = await studentsCollection.findOne({ _id: studentId });
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would save attendance records to a separate collection
    // For now, we'll just update the student's attendance percentage
    const currentAttendance = student.attendancePercentage || 0;
    const newAttendance = status === 'present' 
      ? Math.min(100, currentAttendance + 1) 
      : Math.max(0, currentAttendance - 1);

    await studentsCollection.updateOne(
      { _id: studentId },
      { $set: { attendancePercentage: newAttendance } }
    );

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        date,
        hour,
        status,
        method,
        newAttendancePercentage: newAttendance
      },
      message: 'Attendance recorded successfully'
    });
  } catch (error) {
    console.error('Attendance POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record attendance' },
      { status: 500 }
    );
  }
}

async function handleBulkAttendance(body: any) {
  const studentsCollection = await getCollection('students');
  const { studentId, mode, date, fromDate, toDate, periods, status, method, subjectId } = body;

  if (!studentId || !periods || periods.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields for bulk attendance' },
      { status: 400 }
    );
  }

  // Find student
  const student = await studentsCollection.findOne({ _id: studentId });
  if (!student) {
    return NextResponse.json(
      { success: false, error: 'Student not found' },
      { status: 404 }
    );
  }

  // Calculate number of records to update
  const recordCount = periods.length * (mode === 'single' ? 1 : 5);
  
  // Update attendance percentage based on status
  const currentAttendance = student.attendancePercentage || 0;
  const attendanceChange = status === 'present' ? 1 : -1;
  const newAttendance = Math.max(0, Math.min(100, currentAttendance + (attendanceChange * recordCount / 10)));

  await studentsCollection.updateOne(
    { _id: studentId },
    { $set: { attendancePercentage: newAttendance } }
  );

  return NextResponse.json({
    success: true,
    data: {
      studentId,
      recordCount,
      newAttendancePercentage: newAttendance
    },
    message: `Successfully updated ${recordCount} attendance records`
  });
}