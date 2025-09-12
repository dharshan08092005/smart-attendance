import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get faculty analytics and dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    const studentCollection = await getCollection('recommendation');
    const attendanceCollection = await getCollection('attendance');
    const leaveCollection = await getCollection('leaves');
    
    // Get faculty's assigned students
    const assignedStudents = await studentCollection
      .find({ facultyId: new ObjectId(facultyId) })
      .toArray();

    const studentIds = assignedStudents.map(s => s._id);

    // Basic statistics
    const totalStudents = assignedStudents.length;
    
    // Attendance statistics
    const attendanceStats = await studentCollection.aggregate([
      { $match: { facultyId: new ObjectId(facultyId) } },
      {
        $group: {
          _id: null,
          averageAttendance: { $avg: '$attendancePercentage' },
          minAttendance: { $min: '$attendancePercentage' },
          maxAttendance: { $max: '$attendancePercentage' }
        }
      }
    ]).toArray();

    // GPA statistics
    const gpaStats = await studentCollection.aggregate([
      { $match: { facultyId: new ObjectId(facultyId) } },
      {
        $group: {
          _id: null,
          averageGPA: { $avg: '$GPA' },
          minGPA: { $min: '$GPA' },
          maxGPA: { $max: '$GPA' }
        }
      }
    ]).toArray();

    // Students by attendance ranges
    const attendanceRanges = await studentCollection.aggregate([
      { $match: { facultyId: new ObjectId(facultyId) } },
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

    // Students by GPA ranges
    const gpaRanges = await studentCollection.aggregate([
      { $match: { facultyId: new ObjectId(facultyId) } },
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

    // Recent attendance records
    const recentAttendance = await attendanceCollection
      .find({ facultyId: new ObjectId(facultyId) })
      .sort({ markedAt: -1 })
      .limit(10)
      .toArray();

    // Pending leave requests
    const pendingLeaves = await leaveCollection
      .find({ 
        studentId: { $in: studentIds },
        status: 'pending'
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Students with low attendance
    const lowAttendanceStudents = assignedStudents
      .filter(s => s.attendancePercentage < 75)
      .sort((a, b) => a.attendancePercentage - b.attendancePercentage)
      .slice(0, 10);

    // Students with low GPA
    const lowGPAStudents = assignedStudents
      .filter(s => s.GPA < 2.5)
      .sort((a, b) => a.GPA - b.GPA)
      .slice(0, 10);

    // Risk analysis
    const riskStudents = assignedStudents.filter(student => {
      const attendance = student.attendancePercentage || 0;
      const gpa = student.GPA || 0;
      const leaves = student.leavesInLastMonth || 0;
      return attendance < 75 || gpa < 2.5 || leaves > 5;
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          averageAttendance: Math.round(attendanceStats[0]?.averageAttendance || 0),
          averageGPA: Math.round((gpaStats[0]?.averageGPA || 0) * 100) / 100,
          pendingLeaves: pendingLeaves.length,
          riskStudents: riskStudents.length
        },
        attendanceStats: {
          average: Math.round(attendanceStats[0]?.averageAttendance || 0),
          min: attendanceStats[0]?.minAttendance || 0,
          max: attendanceStats[0]?.maxAttendance || 0,
          ranges: attendanceRanges
        },
        gpaStats: {
          average: Math.round((gpaStats[0]?.averageGPA || 0) * 100) / 100,
          min: gpaStats[0]?.minGPA || 0,
          max: gpaStats[0]?.maxGPA || 0,
          ranges: gpaRanges
        },
        recentAttendance,
        pendingLeaves,
        lowAttendanceStudents,
        lowGPAStudents,
        riskStudents
      }
    });

  } catch (error) {
    console.error('Error fetching faculty analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
