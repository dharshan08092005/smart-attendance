import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const facultyCollection = await getCollection('faculty');
    const subjectsCollection = await getCollection('subject');
    const studentsCollection = await getCollection('recommendation');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const faculty = await facultyCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const total = await facultyCollection.countDocuments();

    // Get subject and student details
    const allSubjectIds = faculty.flatMap(f => f.subjects || []);
    const allStudentIds = faculty.flatMap(f => f.assignedStudents || []);
    
    const subjects = await subjectsCollection
      .find({ _id: { $in: allSubjectIds } })
      .toArray();
    
    const students = await studentsCollection
      .find({ _id: { $in: allStudentIds } })
      .toArray();
    
    const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));

    return NextResponse.json({
      success: true,
      data: {
        faculty: faculty.map(f => ({
          id: f._id.toString(),
          name: f.name,
          department: f.department,
          email: f.email,
          subjects: f.subjects ? f.subjects.length : 0,
          assignedStudents: f.assignedStudents ? f.assignedStudents.length : 0,
          subjectDetails: f.subjects ? f.subjects.map((sId: any) => {
            const subject = subjectMap.get(sId.toString());
            return subject ? { id: subject._id.toString(), name: subject.name, code: subject.code, type: subject.type } : null;
          }).filter(Boolean) : [],
          createdAt: f.createdAt
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
    console.error('Faculty GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculty' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const facultyCollection = await getCollection('faculty');
    const subjectsCollection = await getCollection('subject');
    const body = await request.json();
    const { name, department, email, password, subjects, assignedStudents } = body;

    // Validate required fields
    if (!name || !department || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, department, email, password' },
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

    // Check if faculty already exists
    const existingFaculty = await facultyCollection.findOne({ email });
    if (existingFaculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty with this email already exists' },
        { status: 400 }
      );
    }

    // Validate subjects if provided
    let subjectIds: any[] = [];
    if (subjects && subjects.length > 0) {
      const validSubjects = await subjectsCollection.find({ 
        $or: [
          { code: { $in: subjects } },
          { _id: { $in: subjects } }
        ]
      }).toArray();
      subjectIds = validSubjects.map(s => s._id);
    }

    // Validate assigned students if provided
    let assignedStudentIds: any[] = [];
    if (assignedStudents && assignedStudents.length > 0) {
      const studentsCollection = await getCollection('recommendation');
      const validStudents = await studentsCollection.find({ 
        _id: { $in: assignedStudents.map((id: string) => new ObjectId(id)) } 
      }).toArray();
      assignedStudentIds = validStudents.map(s => s._id);
    }

    // Create faculty with all schema fields
    const faculty = {
      id: `FAC${Date.now()}`, // Generate unique ID
      name,
      department,
      email,
      password, // Store password as plain text
      otp: null,
      otpGeneratedAt: null,
      subjects: subjectIds,
      assignedStudents: assignedStudentIds,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await facultyCollection.insertOne(faculty);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        facultyId: faculty.id,
        name: faculty.name,
        department: faculty.department,
        email: faculty.email,
        subjects: faculty.subjects.length,
        assignedStudents: faculty.assignedStudents.length
      },
      message: 'Faculty created successfully'
    });
  } catch (error) {
    console.error('Faculty POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create faculty' },
      { status: 500 }
    );
  }
}