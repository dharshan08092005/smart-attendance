import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// POST - Bulk operations for students and faculty
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, type, data } = body;

    if (!operation || !type || !data) {
      return NextResponse.json(
        { error: 'Operation, type, and data are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(type === 'student' ? 'recommendation' : 'faculty');
    let result;

    switch (operation) {
      case 'updateAttendance':
        if (type !== 'student') {
          return NextResponse.json(
            { error: 'Attendance update only available for students' },
            { status: 400 }
          );
        }

        const { studentIds, attendancePercentage, method = 'manual' } = data;
        
        result = await collection.updateMany(
          { _id: { $in: studentIds.map((id: string) => new ObjectId(id)) } },
          { 
            $set: { 
              attendancePercentage,
              updatedAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `Updated attendance for ${result.modifiedCount} students`,
          data: { modifiedCount: result.modifiedCount }
        });

      case 'updateGPA':
        if (type !== 'student') {
          return NextResponse.json(
            { error: 'GPA update only available for students' },
            { status: 400 }
          );
        }

        const { studentIds: gpaStudentIds, gpa } = data;
        
        result = await collection.updateMany(
          { _id: { $in: gpaStudentIds.map((id: string) => new ObjectId(id)) } },
          { 
            $set: { 
              GPA: gpa,
              updatedAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `Updated GPA for ${result.modifiedCount} students`,
          data: { modifiedCount: result.modifiedCount }
        });

      case 'assignFaculty':
        if (type !== 'student') {
          return NextResponse.json(
            { error: 'Faculty assignment only available for students' },
            { status: 400 }
          );
        }

        const { studentIds: assignStudentIds, facultyId } = data;
        
        result = await collection.updateMany(
          { _id: { $in: assignStudentIds.map((id: string) => new ObjectId(id)) } },
          { 
            $set: { 
              facultyId: new ObjectId(facultyId),
              updatedAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `Assigned ${result.modifiedCount} students to faculty`,
          data: { modifiedCount: result.modifiedCount }
        });

      case 'delete':
        const { ids } = data;
        
        result = await collection.deleteMany(
          { _id: { $in: ids.map((id: string) => new ObjectId(id)) } }
        );

        return NextResponse.json({
          success: true,
          message: `Deleted ${result.deletedCount} ${type}s`,
          data: { deletedCount: result.deletedCount }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
