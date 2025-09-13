# Faculty OTP Generation System Documentation

## Overview
This system implements a 20-second OTP-based attendance marking system where faculty can generate OTPs and students can use them to mark their attendance.

## System Architecture

### 1. Faculty OTP Generation
- **Endpoint**: `/api/faculty/otp/generate` (POST)
- **Admin Endpoint**: `/api/admin/faculty-otp` (POST)
- **Validity**: 20 seconds
- **Storage**: Faculty schema with automatic cleanup

### 2. Student OTP Verification
- **Endpoint**: `/api/student/otp/verify` (POST)
- **Functionality**: Verifies OTP and marks attendance
- **Hour-based**: Uses current time for period validation

### 3. Database Schema Updates

#### Faculty Schema (Updated)
```typescript
{
  // ... existing fields
  otp: String,                    // 6-digit OTP
  otpGeneratedAt: Date,          // When OTP was generated
  otpExpiresAt: Date,            // When OTP expires (20 seconds)
  otpPeriod: String,             // Period for which OTP is valid
  otpSubjectId: ObjectId         // Subject reference
}
```

#### Student Schema (Updated)
```typescript
{
  // ... existing fields
  attendanceRecords: [{
    date: String,                // Date in YYYY-MM-DD format
    period: String,              // Period (P1, P2, etc.)
    hour: Number,                // Hour when marked
    status: String,              // 'present' or 'absent'
    method: String,              // 'otp', 'qr', or 'manual'
    facultyId: ObjectId,         // Faculty who generated OTP
    subjectId: ObjectId,         // Subject reference
    markedAt: Date               // When attendance was marked
  }]
}
```

## API Endpoints

### 1. Faculty OTP Generation

#### POST `/api/faculty/otp/generate`
Generate OTP for faculty to share with students.

**Request Body:**
```json
{
  "facultyId": "string (required)",
  "period": "string (required)",
  "subjectId": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "otp": "123456",
    "facultyId": "faculty123",
    "facultyName": "Dr. Smith",
    "period": "P1",
    "expiresIn": 20,
    "generatedAt": "2024-01-15T09:00:00Z"
  },
  "message": "OTP generated successfully"
}
```

### 2. Student OTP Verification

#### POST `/api/student/otp/verify`
Verify OTP and mark student attendance.

**Request Body:**
```json
{
  "studentId": "string (required)",
  "otp": "string (required)",
  "period": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "studentId": "student123",
    "studentName": "John Doe",
    "period": "P1",
    "hour": 9,
    "date": "2024-01-15",
    "facultyName": "Dr. Smith",
    "attendanceRecord": {
      "date": "2024-01-15",
      "period": "P1",
      "hour": 9,
      "status": "present",
      "method": "otp",
      "facultyId": "faculty123",
      "subjectId": "subject123",
      "markedAt": "2024-01-15T09:05:00Z"
    }
  },
  "message": "Attendance marked successfully"
}
```

### 3. Admin Faculty OTP Generation

#### POST `/api/admin/faculty-otp`
Admin can generate OTP for any faculty.

**Request Body:**
```json
{
  "facultyId": "string (required)",
  "period": "string (required)",
  "subjectId": "string (optional)"
}
```

## Time-based Period System

### Period Schedule
```typescript
const timeSlots = [
  { period: 'P1', startTime: '09:00', endTime: '10:00', subject: 'Mathematics' },
  { period: 'P2', startTime: '10:00', endTime: '11:00', subject: 'Physics' },
  { period: 'P3', startTime: '11:15', endTime: '12:15', subject: 'Chemistry' },
  { period: 'P4', startTime: '12:15', endTime: '13:15', subject: 'English' },
  { period: 'P5', startTime: '14:00', endTime: '15:00', subject: 'Computer Science' },
  { period: 'P6', startTime: '15:00', endTime: '16:00', subject: 'Biology' }
];
```

### Current Period Detection
The system automatically detects the current period based on the current time and allows students to mark attendance only for the active period.

## Student Dashboard Features

### 1. Real-time Clock
- Updates every second
- Shows current time and active period

### 2. OTP Attendance Form
- Period selection dropdown
- OTP input field (6 digits)
- Submit button with loading state

### 3. Attendance History
- Table showing recent attendance records
- Status indicators (present/absent)
- Method indicators (OTP/QR/Manual)

### 4. Student Information Panel
- Name, roll number, email
- Current attendance percentage
- Faculty assignment

## Security Features

### 1. OTP Validation
- 6-digit numeric OTP
- 20-second expiry
- One-time use (deleted after verification)

### 2. Student Verification
- Checks if student is assigned to faculty
- Prevents duplicate attendance for same period
- Validates period against current time

### 3. Faculty Authorization
- Only assigned faculty can generate OTPs
- Admin can generate OTPs for any faculty

## Automatic Cleanup

### OTP Expiry
- OTPs automatically expire after 20 seconds
- Database cleanup removes expired OTPs
- Prevents reuse of expired OTPs

### Attendance Tracking
- Each attendance record is permanent
- Prevents duplicate marking for same period
- Tracks method used (OTP/QR/Manual)

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Error message"
}
```

### Error Types
- **400**: Bad Request (missing fields, invalid data)
- **403**: Forbidden (student not assigned to faculty)
- **404**: Not Found (student/faculty not found)
- **500**: Internal Server Error (database issues)

## Usage Flow

### 1. Faculty OTP Generation
1. Faculty logs into admin dashboard
2. Selects period and subject
3. Clicks "Generate OTP"
4. System generates 6-digit OTP
5. Faculty shares OTP with students
6. OTP expires after 20 seconds

### 2. Student Attendance Marking
1. Student opens student dashboard
2. Sees current time and active period
3. Selects period from dropdown
4. Enters OTP received from faculty
5. Clicks "Mark Attendance"
6. System verifies OTP and marks attendance
7. OTP is deleted after successful verification

### 3. Attendance Tracking
1. All attendance records are stored permanently
2. Students can view their attendance history
3. Faculty can view attendance reports
4. Admin can generate attendance analytics

## Database Collections

### Faculty Collection
- Stores OTP data temporarily
- Auto-cleanup after 20 seconds
- References subjects and students

### Student Collection (recommendation)
- Stores attendance records
- Tracks attendance percentage
- Links to faculty and subjects

### Subject Collection
- Subject information
- Referenced by faculty and attendance records

## Performance Considerations

### 1. OTP Cleanup
- Uses setTimeout for automatic cleanup
- Prevents database bloat
- Ensures security

### 2. Real-time Updates
- Student dashboard updates every second
- Efficient period detection
- Minimal database queries

### 3. Validation
- Client-side validation for better UX
- Server-side validation for security
- Efficient database queries

## Future Enhancements

### 1. QR Code Support
- Generate QR codes for OTPs
- Scan-based attendance marking
- Mobile-friendly interface

### 2. Push Notifications
- Notify students when OTP is generated
- Real-time attendance updates
- Faculty notifications

### 3. Analytics Dashboard
- Attendance trends
- Faculty performance metrics
- Student engagement tracking

### 4. Mobile App
- Native mobile application
- Offline support
- Biometric authentication
