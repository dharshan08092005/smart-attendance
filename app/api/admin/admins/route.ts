import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollection } from '@/lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();

// GET - Get all admins
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const adminsCollection = await getCollection('admin');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const admins = await adminsCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    const total = await adminsCollection.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        admins: admins.map(admin => ({
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt
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
    console.error('Admins GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

// POST - Create new admin
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const adminsCollection = await getCollection('admin');
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, email, password' },
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

    // Validate role
    if (role && !['super_admin', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be super_admin or admin' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin with this email already exists' },
        { status: 400 }
      );
    }

    // Create admin with all schema fields
    const admin = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Store password as plain text
      role: role || 'admin',
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await adminsCollection.insertOne(admin);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      },
      message: 'Admin created successfully'
    });
  } catch (error) {
    console.error('Admin POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
