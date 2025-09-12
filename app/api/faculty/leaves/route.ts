import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get leave requests for faculty's students
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    const studentCollection = await getCollection('recommendation');
    const leaveCollection = await getCollection('leaves');
    
    // Get faculty's assigned students
    const assignedStudents = await studentCollection
      .find({ facultyId: new ObjectId(facultyId) })
      .project({ _id: 1, name: 1, registrationNumber: 1 })
      .toArray();

    const studentIds = assignedStudents.map(s => s._id);
    
    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, pages: 0 }
      });
    }

    // Build filter for leaves
    let filter: any = { studentId: { $in: studentIds } };
    if (status !== 'all') {
      filter.status = status;
    }

    // Get total count
    const total = await leaveCollection.countDocuments(filter);
    
    // Get leaves with pagination
    const leaves = await leaveCollection
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    // Map student information to leaves
    const leavesWithStudentInfo = leaves.map(leave => {
      const student = assignedStudents.find(s => s._id.toString() === leave.studentId.toString());
      return {
        ...leave,
        studentName: student?.name || 'Unknown',
        registrationNumber: student?.registrationNumber || 'Unknown'
      };
    });

    return NextResponse.json({
      success: true,
      data: leavesWithStudentInfo,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

// PATCH - Update leave request status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leaveId, status, facultyId, comments } = body;

    if (!leaveId || !status || !facultyId) {
      return NextResponse.json(
        { error: 'Leave ID, status, and faculty ID are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be approved or rejected' },
        { status: 400 }
      );
    }

    const leaveCollection = await getCollection('leaves');
    const studentCollection = await getCollection('recommendation');
    
    // Verify the leave belongs to faculty's student
    const leave = await leaveCollection.findOne({ _id: new ObjectId(leaveId) });
    if (!leave) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    const student = await studentCollection.findOne({ 
      _id: new ObjectId(leave.studentId),
      facultyId: new ObjectId(facultyId)
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Unauthorized: Leave request does not belong to your student' },
        { status: 403 }
      );
    }

    // Update leave status
    const result = await leaveCollection.updateOne(
      { _id: new ObjectId(leaveId) },
      { 
        $set: { 
          status,
          reviewedBy: facultyId,
          reviewedAt: new Date(),
          comments: comments || ''
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Leave request ${status} successfully`
    });

  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to update leave request' },
      { status: 500 }
    );
  }
}
