import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getCollection } from '@/lib/mongodb';

// Load environment variables
dotenv.config();

export async function POST(request: NextRequest) {
  try {
    const { email, password, userType } = await request.json();

    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Email, password, and user type are required' },
        { status: 400 }
      );
    }

    let user = null;
    let collectionName = '';

    // Find user based on user type using MongoDB collections directly
    switch (userType) {
      case 'admin':
        const adminCollection = await getCollection('admin');
        user = await adminCollection.findOne({ email });
        collectionName = 'admin';
        break;
      case 'faculty':
        const facultyCollection = await getCollection('faculty');
        user = await facultyCollection.findOne({ email });
        collectionName = 'faculty';
        break;
      case 'student':
        const studentCollection = await getCollection('recommendation');
        user = await studentCollection.findOne({ email });
        collectionName = 'recommendation';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid user type' },
          { status: 400 }
        );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password - use simple password comparison for all users
    const isPasswordValid = password === user.password;
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        userType: userType,
        collectionName: collectionName
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Return user data and token
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      userType: userType,
      collectionName: collectionName
    };

    // Add role-specific data
    // if (userType === 'faculty') {
    //   userData.department = user.department;
    // } else if (userType === 'student') {
    //   userData.rollNumber = user.rollNumber;
    //   userData.registrationNumber = user.registrationNumber;
    // }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
