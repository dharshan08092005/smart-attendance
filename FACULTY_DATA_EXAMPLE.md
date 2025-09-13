# Faculty Data Structure Example

## Updated Faculty Schema

The faculty schema has been updated to include comprehensive information for better frontend integration.

## Example Faculty Data

```json
{
  "_id": "68c4bcbcd781d710cd1146d6",
  "id": "FAC1757723836268",
  "name": "Dr. Sandhiya R",
  "department": "Computer Science",
  "email": "sandhiya@university.edu",
  "password": "password123",
  
  // Contact Information
  "phone": "+91-9876543210",
  "office": "CS-205",
  "designation": "Assistant Professor",
  
  // OTP System (temporary fields)
  "otp": null,
  "otpGeneratedAt": null,
  "otpExpiresAt": null,
  "otpPeriod": null,
  "otpSubjectId": null,
  
  // Academic Information
  "subjects": [
    "68c4bcbcd781d710cd1146d7", // ObjectId reference to Subject
    "68c4bcbcd781d710cd1146d8"
  ],
  "assignedStudents": [
    "68c4bcbcd781d710cd1146d9", // ObjectId reference to Student
    "68c4bcbcd781d710cd1146da"
  ],
  "mentees": [
    "68c4bcbcd781d710cd1146d9", // Specific mentees for guidance
    "68c4bcbcd781d710cd1146db"
  ],
  
  // Timetable Information
  "timetable": [
    {
      "day": "Monday",
      "hour": "09:00-10:00",
      "subject": "Database Management Systems",
      "room": "A-201",
      "type": "theory"
    },
    {
      "day": "Monday",
      "hour": "11:00-12:00",
      "subject": "Operating Systems",
      "room": "Lab-2",
      "type": "practical"
    },
    {
      "day": "Tuesday",
      "hour": "10:00-11:00",
      "subject": "Computer Networks",
      "room": "A-105",
      "type": "theory"
    },
    {
      "day": "Wednesday",
      "hour": "14:00-15:00",
      "subject": "Machine Learning",
      "room": "A-301",
      "type": "theory"
    },
    {
      "day": "Thursday",
      "hour": "09:00-10:00",
      "subject": "Software Engineering",
      "room": "A-101",
      "type": "theory"
    },
    {
      "day": "Friday",
      "hour": "13:00-14:00",
      "subject": "Database Management Systems",
      "room": "A-201",
      "type": "lab"
    }
  ],
  
  // Performance Metrics
  "totalStudents": 45,
  "activeStudents": 42,
  "averageAttendance": 87.5,
  
  // Status and Timestamps
  "isActive": true,
  "lastLogin": "2025-01-13T00:30:00.000Z",
  "createdAt": "2025-01-13T00:25:00.000Z",
  "updatedAt": "2025-01-13T00:30:00.000Z"
}
```

## API Endpoints for Faculty Dashboard

### 1. Get Faculty Mentees
```
GET /api/faculty/mentees?facultyId={facultyId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "68c4bcbcd781d710cd1146d9",
      "name": "Priya N",
      "rollNumber": "21CSE012",
      "registrationNumber": "REG2021001",
      "email": "priya@student.edu",
      "attendancePercentage": 92,
      "GPA": 8.5,
      "leavesInLastMonth": 2,
      "riskLevel": "low",
      "performanceTrend": "improving",
      "lastAttendance": "2025-01-12",
      "engagementRiskScore": 15,
      "studyPerformance": [
        {
          "subjectId": "68c4bcbcd781d710cd1146d7",
          "subjectName": "DBMS",
          "marks": 85,
          "timestamp": "2025-01-10T00:00:00.000Z"
        }
      ],
      "performancePrediction": [
        {
          "subjectId": "68c4bcbcd781d710cd1146d7",
          "predictedMark": 88,
          "trend": "Improving",
          "confidenceScore": 0.85,
          "timestamp": "2025-01-10T00:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  },
  "faculty": {
    "id": "68c4bcbcd781d710cd1146d6",
    "name": "Dr. Sandhiya R",
    "department": "Computer Science",
    "designation": "Assistant Professor"
  }
}
```

### 2. Get Faculty Timetable
```
GET /api/faculty/timetable?facultyId={facultyId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "faculty": {
      "id": "68c4bcbcd781d710cd1146d6",
      "name": "Dr. Sandhiya R",
      "department": "Computer Science",
      "designation": "Assistant Professor"
    },
    "timetable": [
      {
        "id": "TT1",
        "day": "Monday",
        "hour": "09:00-10:00",
        "subject": "Database Management Systems",
        "room": "A-201",
        "type": "theory"
      }
    ]
  }
}
```

### 3. Assign Mentees to Faculty
```
POST /api/faculty/mentees
```

**Request Body:**
```json
{
  "facultyId": "68c4bcbcd781d710cd1146d6",
  "menteeIds": [
    "68c4bcbcd781d710cd1146d9",
    "68c4bcbcd781d710cd1146db"
  ]
}
```

### 4. Update Faculty Timetable
```
POST /api/faculty/timetable
```

**Request Body:**
```json
{
  "facultyId": "68c4bcbcd781d710cd1146d6",
  "timetable": [
    {
      "day": "Monday",
      "hour": "09:00-10:00",
      "subject": "Database Management Systems",
      "room": "A-201",
      "type": "theory"
    }
  ]
}
```

## Frontend Integration

The faculty dashboard now connects to these APIs to display:

1. **Mentees Tab**: Shows assigned mentees with their performance metrics
2. **Timetable Tab**: Displays faculty's weekly schedule
3. **Real-time Data**: All data is fetched from the backend APIs
4. **Risk Assessment**: Color-coded risk levels for mentees
5. **Performance Tracking**: Shows attendance, GPA, and trends

## Database Collections

- **Faculty Collection**: `faculty` - Stores faculty information
- **Student Collection**: `recommendation` - Stores student information
- **Subject Collection**: `subject` - Stores subject information

## Key Features

1. **Comprehensive Faculty Profile**: Includes contact info, designation, office
2. **Academic Management**: Subjects, students, mentees tracking
3. **Timetable Management**: Weekly schedule with room and time details
4. **Performance Metrics**: Student performance tracking and risk assessment
5. **OTP System**: Integrated with attendance marking system
