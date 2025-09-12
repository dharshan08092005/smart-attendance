import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get leave requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const leaveCollection = await getCollection('leaves');
    const studentCollection = await getCollection('recommendation');
    
    // Build filter
    let filter: any = {};
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
    const leavesWithStudentInfo = await Promise.all(
      leaves.map(async (leave) => {
        const student = await studentCollection.findOne({ 
          _id: new ObjectId(leave.studentId) 
        });
        return {
          ...leave,
          studentName: student?.name || 'Unknown',
          registrationNumber: student?.registrationNumber || 'Unknown'
        };
      })
    );

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
    const { leaveId, status, adminId, comments } = body;

    if (!leaveId || !status || !adminId) {
      return NextResponse.json(
        { error: 'Leave ID, status, and admin ID are required' },
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
    
    // Update leave status
    const result = await leaveCollection.updateOne(
      { _id: new ObjectId(leaveId) },
      { 
        $set: { 
          status,
          reviewedBy: adminId,
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
