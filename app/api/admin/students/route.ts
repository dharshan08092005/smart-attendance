import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get all students with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';

    const studentCollection = await getCollection('recommendation');
    
    // Build filter query
    let filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await studentCollection.countDocuments(filter);
    
    // Get students with pagination
    const students = await studentCollection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST - Create new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rollNumber, registrationNumber, email, facultyId } = body;

    if (!name || !rollNumber || !registrationNumber || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const studentCollection = await getCollection('recommendation');
    
    // Check if student already exists
    const existingStudent = await studentCollection.findOne({
      $or: [
        { email },
        { rollNumber },
        { registrationNumber }
      ]
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this email, roll number, or registration number already exists' },
        { status: 400 }
      );
    }

    const newStudent = {
      name,
      rollNumber,
      registrationNumber,
      email,
      facultyId: facultyId || null,
      attendancePercentage: 0,
      GPA: 0,
      leavesInLastMonth: 0,
      otpMissRate: 0,
      engagementRiskScore: 0,
      studyPerformance: [],
      performancePrediction: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await studentCollection.insertOne(newStudent);

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      data: { id: result.insertedId, ...newStudent }
    });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
