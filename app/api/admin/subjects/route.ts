import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const subjectsCollection = await getCollection('subject');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const subjects = await subjectsCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const total = await subjectsCollection.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        subjects: subjects.map(s => ({
          id: s._id.toString(),
          name: s.name,
          code: s.code,
          type: s.type,
          createdAt: s.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Subjects GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const subjectsCollection = await getCollection('subject');
    const body = await request.json();
    const { name, code, type } = body;

    // Validate required fields
    if (!name || !code || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, code, type' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['theory', 'practical'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subject type. Must be theory or practical' },
        { status: 400 }
      );
    }

    // Validate code length
    if (code.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Subject code must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Check if subject code already exists
    const existingSubject = await subjectsCollection.findOne({ 
      code: code.toUpperCase() 
    });
    if (existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject with this code already exists' },
        { status: 400 }
      );
    }

    // Check if subject name already exists
    const existingSubjectByName = await subjectsCollection.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    if (existingSubjectByName) {
      return NextResponse.json(
        { success: false, error: 'Subject with this name already exists' },
        { status: 400 }
      );
    }

    // Create subject with all schema fields
    const subject = {
      name: name.trim(),
      code: code.toUpperCase().trim(),
      type,
      createdAt: new Date()
    };

    const result = await subjectsCollection.insertOne(subject);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        name: subject.name,
        code: subject.code,
        type: subject.type,
        createdAt: subject.createdAt
      },
      message: 'Subject created successfully'
    });
  } catch (error) {
    console.error('Subject POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}
