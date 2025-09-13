import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const studentsCollection = await getCollection('recommendation');
    const facultyCollection = await getCollection('faculty');
    const subjectsCollection = await getCollection('subject');

    // Get dashboard statistics
    const [
      totalStudents,
      totalFaculty,
      totalSubjects,
      students,
      faculty,
      subjects
    ] = await Promise.all([
      studentsCollection.countDocuments(),
      facultyCollection.countDocuments(),
      subjectsCollection.countDocuments(),
      studentsCollection.find({}).limit(10).toArray(),
      facultyCollection.find({}).limit(10).toArray(),
      subjectsCollection.find({}).limit(10).toArray()
    ]);

    // Calculate average attendance
    const attendanceData = await studentsCollection.aggregate([
      { $group: { _id: null, avgAttendance: { $avg: '$attendancePercentage' } } }
    ]).toArray();
    const averageAttendance = attendanceData[0]?.avgAttendance || 0;

    // Get pending leaves (mock data for now)
    const pendingLeaves = 12; // This would come from a Leave model
    const todaySessions = 18; // This would come from a Session model

    const stats = {
      totalStudents,
      totalFaculty,
      totalSubjects,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      pendingLeaves,
      todaySessions
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        students: students.map(s => ({
          id: s._id.toString(),
          name: s.name,
          registrationNumber: s.registrationNumber,
          email: s.email,
          attendancePercentage: s.attendancePercentage || 0,
          gpa: s.GPA || 0
        })),
        faculty: faculty.map(f => ({
          id: f._id.toString(),
          name: f.name,
          department: f.department,
          email: f.email,
          subjects: f.subjects ? f.subjects.length : 0,
          assignedStudents: f.assignedStudents ? f.assignedStudents.length : 0
        })),
        subjects: subjects.map(s => ({
          id: s._id.toString(),
          name: s.name,
          code: s.code,
          type: s.type
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
