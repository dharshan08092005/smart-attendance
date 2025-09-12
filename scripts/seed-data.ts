import bcrypt from 'bcryptjs';
import { getCollection } from '../lib/mongodb';

async function seedData() {
  try {
    console.log('Connected to MongoDB');

    // Get collections
    const adminCollection = await getCollection('admin');
    const facultyCollection = await getCollection('faculty');
    const studentCollection = await getCollection('recommendation');
    const leaveCollection = await getCollection('leaves');
    const attendanceCollection = await getCollection('attendance');
    const otpCollection = await getCollection('otps');

    // Clear existing data
    await adminCollection.deleteMany({});
    await facultyCollection.deleteMany({});
    await studentCollection.deleteMany({});
    await leaveCollection.deleteMany({});
    await attendanceCollection.deleteMany({});
    await otpCollection.deleteMany({});

    // Create sample admin
    const admin = {
      id: 'admin_001',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin', // Simple password without hashing
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await adminCollection.insertOne(admin);
    console.log('Admin created:', admin.email);

    // Create sample faculty
    const faculty = {
      id: 'faculty_001',
      name: 'Dr. John Smith',
      department: 'Computer Science',
      email: 'faculty@example.com',
      password: 'faculty', // Simple password without hashing
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const facultyResult = await facultyCollection.insertOne(faculty);
    console.log('Faculty created:', faculty.email);

    // Create sample student
    const student = {
      name: 'Jane Doe',
      rollNumber: 'CS2024001',
      registrationNumber: 'REG2024001',
      email: 'student@example.com',
      password: 'student', // Simple password without hashing
      facultyId: facultyResult.insertedId,
      attendancePercentage: 85,
      GPA: 3.5,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await studentCollection.insertOne(student);
    console.log('Student created:', student.email);

    console.log('Sample data seeded successfully!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@example.com / admin');
    console.log('Faculty: faculty@example.com / faculty');
    console.log('Student: student@example.com / student');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit(0);
  }
}

seedData();
