import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'attendance':
        return await getAttendanceAnalytics();
      case 'performance':
        return await getPerformanceAnalytics();
      case 'faculty':
        return await getFacultyAnalytics();
      case 'subjects':
        return await getSubjectAnalytics();
      default:
        return await getOverviewAnalytics();
    }
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics() {
  const studentsCollection = await getCollection('recommendation');
  const facultyCollection = await getCollection('faculty');
  const subjectsCollection = await getCollection('subject');

  const [
    totalStudents,
    totalFaculty,
    totalSubjects,
    attendanceStats,
    gpaStats,
    departmentStats
  ] = await Promise.all([
    studentsCollection.countDocuments(),
    facultyCollection.countDocuments(),
    subjectsCollection.countDocuments(),
    studentsCollection.aggregate([
      {
        $group: {
          _id: null,
          avgAttendance: { $avg: '$attendancePercentage' },
          minAttendance: { $min: '$attendancePercentage' },
          maxAttendance: { $max: '$attendancePercentage' }
        }
      }
    ]).toArray(),
    studentsCollection.aggregate([
      {
        $group: {
          _id: null,
          avgGPA: { $avg: '$GPA' },
          minGPA: { $min: '$GPA' },
          maxGPA: { $max: '$GPA' }
        }
      }
    ]).toArray(),
    facultyCollection.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray()
  ]);

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalStudents,
        totalFaculty,
        totalSubjects
      },
      attendance: attendanceStats[0] || { avgAttendance: 0, minAttendance: 0, maxAttendance: 0 },
      gpa: gpaStats[0] || { avgGPA: 0, minGPA: 0, maxGPA: 0 },
      departments: departmentStats
    }
  });
}

async function getAttendanceAnalytics() {
  const studentsCollection = await getCollection('recommendation');
  
  const attendanceRanges = await studentsCollection.aggregate([
    {
      $bucket: {
        groupBy: '$attendancePercentage',
        boundaries: [0, 25, 50, 75, 90, 100],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          students: { $push: { name: '$name', registrationNumber: '$registrationNumber', attendance: '$attendancePercentage' } }
        }
      }
    }
  ]).toArray();

  const lowAttendanceStudents = await studentsCollection.find({
    attendancePercentage: { $lt: 75 }
  }).limit(10).toArray();

  return NextResponse.json({
    success: true,
    data: {
      attendanceRanges,
      lowAttendanceStudents
    }
  });
}

async function getPerformanceAnalytics() {
  const studentsCollection = await getCollection('recommendation');
  
  const performanceData = await studentsCollection.aggregate([
    {
      $group: {
        _id: null,
        avgGPA: { $avg: '$GPA' },
        avgAttendance: { $avg: '$attendancePercentage' },
        avgLeaves: { $avg: '$leavesInLastMonth' },
        avgOtpMissRate: { $avg: '$otpMissRate' }
      }
    }
  ]).toArray();

  const topPerformers = await studentsCollection.find()
    .sort({ GPA: -1, attendancePercentage: -1 })
    .limit(10)
    .toArray();

  const riskStudents = await studentsCollection.find({
    $or: [
      { attendancePercentage: { $lt: 75 } },
      { GPA: { $lt: 2.5 } },
      { leavesInLastMonth: { $gt: 5 } }
    ]
  }).limit(10).toArray();

  return NextResponse.json({
    success: true,
    data: {
      performance: performanceData[0] || {},
      topPerformers,
      riskStudents
    }
  });
}

async function getFacultyAnalytics() {
  const facultyCollection = await getCollection('faculty');
  const subjectsCollection = await getCollection('subject');
  const studentsCollection = await getCollection('recommendation');
  
  const facultyStats = await facultyCollection.aggregate([
    {
      $lookup: {
        from: 'subjects',
        localField: 'subjects',
        foreignField: '_id',
        as: 'subjectDetails'
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: 'assignedStudents',
        foreignField: '_id',
        as: 'studentDetails'
      }
    },
    {
      $project: {
        name: 1,
        department: 1,
        subjectCount: { $size: '$subjects' },
        studentCount: { $size: '$assignedStudents' },
        subjects: '$subjectDetails.name'
      }
    }
  ]).toArray();

  const departmentStats = await facultyCollection.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  return NextResponse.json({
    success: true,
    data: {
      facultyStats,
      departmentStats
    }
  });
}

async function getSubjectAnalytics() {
  const subjectsCollection = await getCollection('subject');
  const facultyCollection = await getCollection('faculty');
  
  const subjectStats = await subjectsCollection.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]).toArray();

  const subjectUsage = await facultyCollection.aggregate([
    { $unwind: '$subjects' },
    { $lookup: { from: 'subjects', localField: 'subjects', foreignField: '_id', as: 'subjectDetails' } },
    { $unwind: '$subjectDetails' },
    { $group: { _id: '$subjectDetails.name', count: { $sum: 1 }, code: { $first: '$subjectDetails.code' } } },
    { $sort: { count: -1 } }
  ]).toArray();

  return NextResponse.json({
    success: true,
    data: {
      subjectStats,
      subjectUsage
    }
  });
}