import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get dashboard analytics and statistics
export async function GET(request: NextRequest) {
  try {
    const studentCollection = await getCollection('recommendation');
    const facultyCollection = await getCollection('faculty');
    const adminCollection = await getCollection('admin');

    // Get basic counts
    const totalStudents = await studentCollection.countDocuments({});
    const totalFaculty = await facultyCollection.countDocuments({});
    const totalAdmins = await adminCollection.countDocuments({});

    // Get attendance statistics
    const attendanceStats = await studentCollection.aggregate([
      {
        $group: {
          _id: null,
          averageAttendance: { $avg: '$attendancePercentage' },
          minAttendance: { $min: '$attendancePercentage' },
          maxAttendance: { $max: '$attendancePercentage' }
        }
      }
    ]).toArray();

    // Get GPA statistics
    const gpaStats = await studentCollection.aggregate([
      {
        $group: {
          _id: null,
          averageGPA: { $avg: '$GPA' },
          minGPA: { $min: '$GPA' },
          maxGPA: { $max: '$GPA' }
        }
      }
    ]).toArray();

    // Get students by attendance ranges
    const attendanceRanges = await studentCollection.aggregate([
      {
        $bucket: {
          groupBy: '$attendancePercentage',
          boundaries: [0, 50, 70, 85, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            students: { $push: { name: '$name', email: '$email', attendance: '$attendancePercentage' } }
          }
        }
      }
    ]).toArray();

    // Get students by GPA ranges
    const gpaRanges = await studentCollection.aggregate([
      {
        $bucket: {
          groupBy: '$GPA',
          boundaries: [0, 2.0, 2.5, 3.0, 3.5, 4.0],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            students: { $push: { name: '$name', email: '$email', gpa: '$GPA' } }
          }
        }
      }
    ]).toArray();

    // Get faculty by department
    const facultyByDepartment = await facultyCollection.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          faculty: { $push: { name: '$name', email: '$email' } }
        }
      }
    ]).toArray();

    // Get recent students (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentStudents = await studentCollection
      .find({ createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get students with low attendance (< 75%)
    const lowAttendanceStudents = await studentCollection
      .find({ attendancePercentage: { $lt: 75 } })
      .sort({ attendancePercentage: 1 })
      .limit(10)
      .toArray();

    // Get students with low GPA (< 2.5)
    const lowGPAStudents = await studentCollection
      .find({ GPA: { $lt: 2.5 } })
      .sort({ GPA: 1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalFaculty,
          totalAdmins,
          averageAttendance: attendanceStats[0]?.averageAttendance || 0,
          averageGPA: gpaStats[0]?.averageGPA || 0
        },
        attendanceStats: {
          average: attendanceStats[0]?.averageAttendance || 0,
          min: attendanceStats[0]?.minAttendance || 0,
          max: attendanceStats[0]?.maxAttendance || 0,
          ranges: attendanceRanges
        },
        gpaStats: {
          average: gpaStats[0]?.averageGPA || 0,
          min: gpaStats[0]?.minGPA || 0,
          max: gpaStats[0]?.maxGPA || 0,
          ranges: gpaRanges
        },
        facultyByDepartment,
        recentStudents,
        lowAttendanceStudents,
        lowGPAStudents
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
