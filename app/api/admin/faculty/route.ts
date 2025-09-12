import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get all faculty with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';

    const facultyCollection = await getCollection('faculty');
    
    // Build filter query
    let filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    // Get total count
    const total = await facultyCollection.countDocuments(filter);
    
    // Get faculty with pagination
    const faculty = await facultyCollection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Get assigned students count for each faculty
    const studentCollection = await getCollection('recommendation');
    const facultyWithCounts = await Promise.all(
      faculty.map(async (f) => {
        const assignedStudentsCount = await studentCollection.countDocuments({
          facultyId: f._id
        });
        return {
          ...f,
          assignedStudentsCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: facultyWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

// POST - Create new faculty
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, department, email, password } = body;

    if (!id || !name || !department || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const facultyCollection = await getCollection('faculty');
    
    // Check if faculty already exists
    const existingFaculty = await facultyCollection.findOne({
      $or: [{ email }, { id }]
    });

    if (existingFaculty) {
      return NextResponse.json(
        { error: 'Faculty with this email or ID already exists' },
        { status: 400 }
      );
    }

    const newFaculty = {
      id,
      name,
      department,
      email,
      password,
      subjects: [],
      assignedStudents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await facultyCollection.insertOne(newFaculty);

    return NextResponse.json({
      success: true,
      message: 'Faculty created successfully',
      data: { id: result.insertedId, ...newFaculty }
    });

  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json(
      { error: 'Failed to create faculty' },
      { status: 500 }
    );
  }
}
