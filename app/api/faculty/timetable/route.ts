import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get faculty timetable
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    const timetableCollection = await getCollection('timetable');
    
    // Get faculty timetable
    const timetable = await timetableCollection
      .find({ facultyId: new ObjectId(facultyId) })
      .sort({ day: 1, startTime: 1 })
      .toArray();

    // Group by day
    const groupedTimetable = timetable.reduce((acc: any, slot: any) => {
      const day = slot.day;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(slot);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        timetable: groupedTimetable,
        totalSlots: timetable.length
      }
    });

  } catch (error) {
    console.error('Error fetching timetable:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timetable' },
      { status: 500 }
    );
  }
}

// POST - Create or update timetable slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      facultyId, 
      day, 
      startTime, 
      endTime, 
      subject, 
      room, 
      type = 'lecture' 
    } = body;

    if (!facultyId || !day || !startTime || !endTime || !subject) {
      return NextResponse.json(
        { error: 'Faculty ID, day, start time, end time, and subject are required' },
        { status: 400 }
      );
    }

    const timetableCollection = await getCollection('timetable');
    
    // Check for time conflicts
    const conflictingSlot = await timetableCollection.findOne({
      facultyId: new ObjectId(facultyId),
      day,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingSlot) {
      return NextResponse.json(
        { error: 'Time slot conflicts with existing schedule' },
        { status: 400 }
      );
    }

    const timetableSlot = {
      facultyId: new ObjectId(facultyId),
      day,
      startTime,
      endTime,
      subject,
      room: room || '',
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await timetableCollection.insertOne(timetableSlot);

    return NextResponse.json({
      success: true,
      message: 'Timetable slot created successfully',
      data: { id: result.insertedId, ...timetableSlot }
    });

  } catch (error) {
    console.error('Error creating timetable slot:', error);
    return NextResponse.json(
      { error: 'Failed to create timetable slot' },
      { status: 500 }
    );
  }
}
