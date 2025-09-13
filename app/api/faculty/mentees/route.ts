import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get mentees for a faculty member
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

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
    const studentCollection = await getCollection('recommendation');

    // Check if faculty exists
    const faculty = await facultyCollection.findOne({ _id: new ObjectId(facultyId) });
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Get mentees (assigned students)
    const menteeIds = faculty.mentees || faculty.assignedStudents || [];
    
    if (menteeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        },
        message: 'No mentees assigned to this faculty'
      });
    }

    // Build filter query for mentees
    let filter: any = { 
      _id: { $in: menteeIds.map((id: any) => new ObjectId(id)) }
    };
    
    if (search) {
      filter.$and = [
        filter,
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { rollNumber: { $regex: search, $options: 'i' } },
            { registrationNumber: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Get total count
    const total = await studentCollection.countDocuments(filter);
    
    // Get mentees with pagination
    const mentees = await studentCollection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate additional metrics for each mentee
    const menteesWithMetrics = mentees.map(mentee => ({
      id: mentee._id,
      name: mentee.name,
      rollNumber: mentee.rollNumber,
      registrationNumber: mentee.registrationNumber,
      email: mentee.email,
      attendancePercentage: mentee.attendancePercentage || 0,
      GPA: mentee.GPA || 0,
      leavesInLastMonth: mentee.leavesInLastMonth || 0,
      riskLevel: calculateRiskLevel(mentee),
      performanceTrend: calculatePerformanceTrend(mentee),
      lastAttendance: getLastAttendance(mentee),
      engagementRiskScore: mentee.engagementRiskScore || null,
      studyPerformance: mentee.studyPerformance || [],
      performancePrediction: mentee.performancePrediction || []
    }));

    return NextResponse.json({
      success: true,
      data: menteesWithMetrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      faculty: {
        id: faculty._id,
        name: faculty.name,
        department: faculty.department,
        designation: faculty.designation || 'Assistant Professor'
      }
    });

  } catch (error) {
    console.error('Error fetching faculty mentees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mentees' },
      { status: 500 }
    );
  }
}

// POST - Assign mentees to faculty
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { facultyId, menteeIds } = body;

    if (!facultyId || !menteeIds || !Array.isArray(menteeIds)) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID and mentee IDs array are required' },
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
    const studentCollection = await getCollection('recommendation');

    // Check if faculty exists
    const faculty = await facultyCollection.findOne({ _id: new ObjectId(facultyId) });
    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Validate mentee IDs
    const validMenteeIds = menteeIds.filter((id: string) => ObjectId.isValid(id));
    if (validMenteeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid mentee IDs provided' },
        { status: 400 }
      );
    }

    // Check if mentees exist
    const mentees = await studentCollection.find({
      _id: { $in: validMenteeIds.map((id: string) => new ObjectId(id)) }
    }).toArray();

    if (mentees.length !== validMenteeIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some mentees not found' },
        { status: 404 }
      );
    }

    // Update faculty with mentees
    const result = await facultyCollection.updateOne(
      { _id: new ObjectId(facultyId) },
      { 
        $set: { 
          mentees: validMenteeIds.map((id: string) => new ObjectId(id)),
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to assign mentees' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mentees assigned successfully',
      data: {
        facultyId,
        menteeCount: validMenteeIds.length,
        mentees: mentees.map(mentee => ({
          id: mentee._id,
          name: mentee.name,
          rollNumber: mentee.rollNumber,
          registrationNumber: mentee.registrationNumber
        }))
      }
    });

  } catch (error) {
    console.error('Error assigning mentees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign mentees' },
      { status: 500 }
    );
  }
}

// Helper function to calculate risk level
function calculateRiskLevel(student: any): string {
  const attendance = student.attendancePercentage || 0;
  const gpa = student.GPA || 0;
  const leaves = student.leavesInLastMonth || 0;
  
  if (attendance < 75 || gpa < 2.5 || leaves > 5) {
    return 'high';
  } else if (attendance < 85 || gpa < 3.0 || leaves > 3) {
    return 'medium';
  }
  return 'low';
}

// Helper function to calculate performance trend
function calculatePerformanceTrend(student: any): string {
  const performance = student.studyPerformance || [];
  if (performance.length < 2) return 'stable';
  
  const recent = performance.slice(-2);
  const trend = recent[1].marks - recent[0].marks;
  
  if (trend > 5) return 'improving';
  if (trend < -5) return 'declining';
  return 'stable';
}

// Helper function to get last attendance
function getLastAttendance(student: any): string {
  const attendanceRecords = student.attendanceRecords || [];
  if (attendanceRecords.length === 0) return 'No records';
  
  const lastRecord = attendanceRecords[attendanceRecords.length - 1];
  return lastRecord.date || 'No records';
}
