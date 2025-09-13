# Admin Dashboard API Documentation

## Overview
This document describes the POST methods for the admin dashboard API, including all database schema fields and validation rules.

## Database Collections
- **Students**: `recommendation` collection
- **Faculty**: `faculty` collection  
- **Subjects**: `subjects` collection
- **Admins**: `admin` collection

## API Endpoints

### 1. Students API - POST `/api/admin/students`

Creates a new student with comprehensive data validation.

#### Request Body
```json
{
  "name": "string (required)",
  "rollNumber": "string (required, unique)",
  "registrationNumber": "string (required, unique)",
  "email": "string (required, unique, valid email format)",
  "password": "string (required)",
  "facultyId": "ObjectId (optional)",
  "attendancePercentage": "number (optional, default: 0)",
  "GPA": "number (optional, default: 0)",
  "leavesInLastMonth": "number (optional, default: 0)",
  "otpMissRate": "number (optional, default: 0)",
  "engagementRiskScore": "number (optional)",
  "studyPerformance": [
    {
      "subjectId": "ObjectId",
      "subjectName": "string",
      "marks": "number",
      "timestamp": "Date"
    }
  ],
  "performancePrediction": [
    {
      "subjectId": "ObjectId",
      "predictedMark": "number",
      "trend": "string (enum: ['Improving', 'Declining'])",
      "confidenceScore": "number",
      "timestamp": "Date"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "rollNumber": "string",
    "registrationNumber": "string",
    "email": "string",
    "facultyId": "ObjectId",
    "attendancePercentage": "number",
    "GPA": "number",
    "leavesInLastMonth": "number",
    "otpMissRate": "number",
    "engagementRiskScore": "number"
  },
  "message": "Student created successfully"
}
```

### 2. Faculty API - POST `/api/admin/faculty`

Creates a new faculty member with subject and student assignments.

#### Request Body
```json
{
  "name": "string (required)",
  "department": "string (required)",
  "email": "string (required, unique, valid email format)",
  "password": "string (required)",
  "subjects": ["string or ObjectId array (optional)"],
  "assignedStudents": ["ObjectId array (optional)"]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "facultyId": "string",
    "name": "string",
    "department": "string",
    "email": "string",
    "subjects": "number",
    "assignedStudents": "number"
  },
  "message": "Faculty created successfully"
}
```

### 3. Subjects API - POST `/api/admin/subjects`

Creates a new subject with validation for code and name uniqueness.

#### Request Body
```json
{
  "name": "string (required, unique)",
  "code": "string (required, unique, min 2 characters)",
  "type": "string (required, enum: ['theory', 'practical'])"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "code": "string",
    "type": "string",
    "createdAt": "Date"
  },
  "message": "Subject created successfully"
}
```

### 4. Admins API - POST `/api/admin/admins`

Creates a new admin user with role-based access.

#### Request Body
```json
{
  "name": "string (required)",
  "email": "string (required, unique, valid email format)",
  "password": "string (required)",
  "role": "string (optional, enum: ['super_admin', 'admin'], default: 'admin')"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "isActive": "boolean",
    "createdAt": "Date"
  },
  "message": "Admin created successfully"
}
```

## Validation Rules

### Common Validations
- **Email Format**: Must be valid email format using regex validation
- **Required Fields**: All required fields must be provided
- **Unique Constraints**: Email, rollNumber, registrationNumber, subject codes must be unique
- **Password Storage**: Passwords are stored as plain text (no hashing)

### Student Validations
- **Faculty ID**: If provided, must reference existing faculty
- **Email Format**: Valid email format required
- **Unique Fields**: Email, rollNumber, registrationNumber must be unique

### Faculty Validations
- **Subject References**: Can accept subject codes or ObjectIds
- **Student References**: Must reference existing students by ObjectId
- **Email Format**: Valid email format required

### Subject Validations
- **Code Length**: Minimum 2 characters
- **Type Enum**: Must be 'theory' or 'practical'
- **Name Uniqueness**: Case-insensitive name uniqueness
- **Code Uniqueness**: Uppercase code uniqueness

### Admin Validations
- **Role Enum**: Must be 'super_admin' or 'admin'
- **Email Format**: Valid email format required
- **Email Uniqueness**: Must be unique across all admins

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `404`: Not Found (referenced entities don't exist)
- `409`: Conflict (duplicate entries)
- `500`: Internal Server Error

## Database Schema Fields

### Student Schema (recommendation collection)
- `name`: String, required
- `rollNumber`: String, required, unique
- `registrationNumber`: String, required, unique
- `email`: String, required, unique
- `password`: String, required
- `facultyId`: ObjectId, optional, ref: 'Faculty'
- `otp`: String, optional
- `otpGeneratedAt`: Date, optional
- `attendancePercentage`: Number, default: 0
- `GPA`: Number, default: 0
- `leavesInLastMonth`: Number, default: 0
- `otpMissRate`: Number, default: 0
- `engagementRiskScore`: Number, optional
- `studyPerformance`: Array of objects
- `performancePrediction`: Array of objects
- `createdAt`: Date, default: Date.now
- `updatedAt`: Date, default: Date.now

### Faculty Schema (faculty collection)
- `id`: String, required (generated)
- `name`: String, required
- `department`: String, required
- `email`: String, required, unique
- `password`: String, required
- `otp`: String, optional
- `otpGeneratedAt`: Date, optional
- `subjects`: Array of ObjectIds, ref: 'Subject'
- `assignedStudents`: Array of ObjectIds, ref: 'Student'
- `createdAt`: Date, default: Date.now
- `updatedAt`: Date, default: Date.now

### Subject Schema (subjects collection)
- `name`: String, required
- `code`: String, required, unique
- `type`: String, enum: ['theory', 'practical'], required
- `createdAt`: Date, default: Date.now

### Admin Schema (admin collection)
- `name`: String, required
- `email`: String, required, unique
- `password`: String, required
- `role`: String, enum: ['super_admin', 'admin'], default: 'admin'
- `isActive`: Boolean, default: true
- `lastLogin`: Date, optional
- `createdAt`: Date, default: Date.now
- `updatedAt`: Date, default: Date.now
