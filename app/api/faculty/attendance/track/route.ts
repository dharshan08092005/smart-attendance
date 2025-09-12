import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get marked students for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const sessionId = searchParams.get('sessionId');

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    const attendanceCollection = await getCollection('attendance');
    const studentCollection = await getCollection('recommendation');
    
    // Build filter
    let filter: any = { facultyId: new ObjectId(facultyId) };
    if (sessionId) {
      filter.sessionId = sessionId;
    }

    // Get attendance records
    const attendanceRecords = await attendanceCollection
      .find(filter)
      .sort({ markedAt: -1 })
      .toArray();

    // Get student details for each attendance record
    const markedStudents = await Promise.all(
      attendanceRecords.map(async (record) => {
        const student = await studentCollection.findOne({ 
          _id: new ObjectId(record.studentId) 
        });
        
        return {
          id: record._id,
          studentId: record.studentId,
          studentName: student?.name || 'Unknown',
          registrationNumber: student?.registrationNumber || 'Unknown',
          markedAt: record.markedAt,
          method: record.method,
          status: record.status,
          sessionId: record.sessionId
        };
      })
    );

    // Group by session if no specific session requested
    const groupedBySession = sessionId ? 
      markedStudents : 
      groupBySession(markedStudents);

    return NextResponse.json({
      success: true,
      data: {
        markedStudents: sessionId ? markedStudents : groupedBySession,
        totalMarked: markedStudents.length
      }
    });

  } catch (error) {
    console.error('Error tracking attendance:', error);
    return NextResponse.json(
      { error: 'Failed to track attendance' },
      { status: 500 }
    );
  }
}

// Helper function to group students by session
function groupBySession(students: any[]): any {
  const grouped: any = {};
  
  students.forEach(student => {
    const sessionId = student.sessionId;
    if (!grouped[sessionId]) {
      grouped[sessionId] = {
        sessionId,
        students: [],
        totalMarked: 0,
        createdAt: student.markedAt
      };
    }
    grouped[sessionId].students.push(student);
    grouped[sessionId].totalMarked++;
  });

  return Object.values(grouped);
}
