import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get attendance records with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const studentCollection = await getCollection('recommendation');
    
    // Build filter query
    let filter: any = {};
    if (studentId) {
      filter._id = new ObjectId(studentId);
    }

    // Get students with attendance data
    const students = await studentCollection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Filter by attendance percentage if status is provided
    let filteredStudents = students;
    if (status === 'low') {
      filteredStudents = students.filter(s => s.attendancePercentage < 75);
    } else if (status === 'high') {
      filteredStudents = students.filter(s => s.attendancePercentage >= 85);
    }

    return NextResponse.json({
      success: true,
      data: filteredStudents,
      pagination: {
        page,
        limit,
        total: filteredStudents.length,
        pages: Math.ceil(filteredStudents.length / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

// POST - Update student attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, attendancePercentage, method = 'manual' } = body;

    if (!studentId || attendancePercentage === undefined) {
      return NextResponse.json(
        { error: 'Student ID and attendance percentage are required' },
        { status: 400 }
      );
    }

    const studentCollection = await getCollection('recommendation');
    
    const result = await studentCollection.updateOne(
      { _id: new ObjectId(studentId) },
      { 
        $set: { 
          attendancePercentage,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance updated successfully'
    });

  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}
