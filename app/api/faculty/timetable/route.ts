import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get timetable for a faculty member
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    // Validate facultyId format
    if (!ObjectId.isValid(facultyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid faculty ID format' },
        { status: 400 }
      );
    }

    const facultyCollection = await getCollection('faculty');

    // Check if faculty exists
    const faculty = await facultyCollection.findOne({ _id: new ObjectId(facultyId) });
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Get timetable from faculty document or return default
    const timetable = faculty.timetable || getDefaultTimetable(faculty.name);

    return NextResponse.json({
      success: true,
      data: {
        faculty: {
          id: faculty._id,
          name: faculty.name,
          department: faculty.department,
          designation: faculty.designation || 'Assistant Professor'
        },
        timetable
      }
    });

  } catch (error) {
    console.error('Error fetching faculty timetable:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timetable' },
      { status: 500 }
    );
  }
}

// POST - Update timetable for a faculty member
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { facultyId, timetable } = body;

    if (!facultyId || !timetable || !Array.isArray(timetable)) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID and timetable array are required' },
        { status: 400 }
      );
    }

    // Validate facultyId format
    if (!ObjectId.isValid(facultyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid faculty ID format' },
        { status: 400 }
      );
    }

    const facultyCollection = await getCollection('faculty');

    // Check if faculty exists
    const faculty = await facultyCollection.findOne({ _id: new ObjectId(facultyId) });
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Validate timetable entries
    const validTimetable = timetable.filter((entry: any) => 
      entry.day && entry.hour && entry.subject && entry.room
    );

    // Update faculty timetable
    const result = await facultyCollection.updateOne(
      { _id: new ObjectId(facultyId) },
      { 
        $set: { 
          timetable: validTimetable,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update timetable' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Timetable updated successfully',
      data: {
        facultyId,
        timetable: validTimetable
      }
    });

  } catch (error) {
    console.error('Error updating faculty timetable:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update timetable' },
      { status: 500 }
    );
  }
}

// Helper function to generate default timetable
function getDefaultTimetable(facultyName: string) {
  const subjects = ['DBMS', 'OS', 'CN', 'ML', 'SE'];
  const rooms = ['A-201', 'Lab-2', 'A-105', 'A-301', 'A-101'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = ['09:00-10:00', '11:00-12:00', '10:00-11:00', '14:00-15:00', '13:00-14:00'];
  const types = ['theory', 'practical', 'lab'];

  return days.map((day, index) => ({
    id: `TT${index + 1}`,
    day,
    hour: hours[index % hours.length],
    subject: subjects[index % subjects.length],
    room: rooms[index % rooms.length],
    type: types[index % types.length]
  }));
}