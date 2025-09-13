import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const studentsCollection = await getCollection('recommendation');
    const facultyCollection = await getCollection('faculty');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const students = await studentsCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const total = await studentsCollection.countDocuments();

    // Get faculty names for students
    const facultyIds = students.map(s => s.facultyId).filter(Boolean);
    const faculty = await facultyCollection
      .find({ _id: { $in: facultyIds } })
      .toArray();
    
    const facultyMap = new Map(faculty.map(f => [f._id.toString(), f]));

    return NextResponse.json({
      success: true,
      data: {
        students: students.map(s => ({
          id: s._id.toString(),
          name: s.name,
          rollNumber: s.rollNumber,
          registrationNumber: s.registrationNumber,
          email: s.email,
          facultyId: s.facultyId,
          facultyName: s.facultyId ? facultyMap.get(s.facultyId.toString())?.name : null,
          attendancePercentage: s.attendancePercentage || 0,
          gpa: s.GPA || 0,
          leavesInLastMonth: s.leavesInLastMonth || 0,
          otpMissRate: s.otpMissRate || 0,
          engagementRiskScore: s.engagementRiskScore || 0,
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
    console.error('Students GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const studentsCollection = await getCollection('recommendation');
    const body = await request.json();
    const { 
      name, 
      rollNumber, 
      registrationNumber, 
      email, 
      password, 
      facultyId, 
      attendancePercentage, 
      GPA, 
      leavesInLastMonth, 
      otpMissRate, 
      engagementRiskScore,
      studyPerformance,
      performancePrediction
    } = body;

    // Validate required fields
    if (!name || !rollNumber || !registrationNumber || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, rollNumber, registrationNumber, email, password' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if student already exists
    const existingStudent = await studentsCollection.findOne({
      $or: [
        { email },
        { rollNumber },
        { registrationNumber }
      ]
    });

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student with this email, roll number, or registration number already exists' },
        { status: 400 }
      );
    }

    // Validate facultyId if provided
    if (facultyId) {
      const facultyCollection = await getCollection('faculty');
      const faculty = await facultyCollection.findOne({ _id: new ObjectId(facultyId) });
      if (!faculty) {
        return NextResponse.json(
          { success: false, error: 'Invalid faculty ID' },
          { status: 400 }
        );
      }
    }

    // Create student with all schema fields
    const student = {
      name,
      rollNumber,
      registrationNumber,
      email,
      password, // Store password as plain text
      facultyId: facultyId ? new ObjectId(facultyId) : null,
      otp: null,
      otpGeneratedAt: null,
      attendancePercentage: attendancePercentage || 0,
      GPA: GPA || 0,
      leavesInLastMonth: leavesInLastMonth || 0,
      otpMissRate: otpMissRate || 0,
      engagementRiskScore: engagementRiskScore || null,
      studyPerformance: studyPerformance || [],
      performancePrediction: performancePrediction || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await studentsCollection.insertOne(student);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        name: student.name,
        rollNumber: student.rollNumber,
        registrationNumber: student.registrationNumber,
        email: student.email,
        facultyId: student.facultyId,
        attendancePercentage: student.attendancePercentage,
        GPA: student.GPA,
        leavesInLastMonth: student.leavesInLastMonth,
        otpMissRate: student.otpMissRate,
        engagementRiskScore: student.engagementRiskScore
      },
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('Student POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
