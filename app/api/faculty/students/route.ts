import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get assigned students for faculty
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    const studentCollection = await getCollection('recommendation');
    
    // Build filter query for assigned students
    let filter: any = { facultyId: new ObjectId(facultyId) };
    
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

    // Calculate additional metrics for each student
    const studentsWithMetrics = students.map(student => ({
      ...student,
      riskLevel: calculateRiskLevel(student),
      performanceTrend: calculatePerformanceTrend(student),
      lastAttendance: getLastAttendance(student)
    }));

    return NextResponse.json({
      success: true,
      data: studentsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching faculty students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
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
  // This would be calculated based on actual attendance records
  // For now, return a mock value
  return new Date().toISOString().split('T')[0];
}