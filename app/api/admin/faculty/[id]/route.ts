import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get single faculty by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const facultyCollection = await getCollection('faculty');
    const faculty = await facultyCollection.findOne({ 
      _id: new ObjectId(params.id) 
    });

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Get assigned students
    const studentCollection = await getCollection('recommendation');
    const assignedStudents = await studentCollection
      .find({ facultyId: faculty._id })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        ...faculty,
        assignedStudents
      }
    });

  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty' },
      { status: 500 }
    );
  }
}

// PUT - Update faculty
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, department, email, subjects, assignedStudents } = body;

    const facultyCollection = await getCollection('faculty');
    
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    const result = await facultyCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Faculty updated successfully'
    });

  } catch (error) {
    console.error('Error updating faculty:', error);
    return NextResponse.json(
      { error: 'Failed to update faculty' },
      { status: 500 }
    );
  }
}

// DELETE - Delete faculty
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const facultyCollection = await getCollection('faculty');
    
    const result = await facultyCollection.deleteOne({ 
      _id: new ObjectId(params.id) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Faculty deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting faculty:', error);
    return NextResponse.json(
      { error: 'Failed to delete faculty' },
      { status: 500 }
    );
  }
}
