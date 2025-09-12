# Smart Attendance System - Backend Setup

## Environment Configuration

1. Create a `.env.local` file in the root directory with the following content:

```env
MONGODB_URI=mongodb+srv://tridev2416_db_user:<db_password>@details.6iq1xlw.mongodb.net/?retryWrites=true&w=majority&appName=details
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

**Important:** Replace `<db_password>` with your actual MongoDB password.

## Database Collections

The system uses the following MongoDB collections:
- **admin** - For admin users
- **faculty** - For faculty members  
- **recommendation** - For students (as specified in requirements)

## Models Created

### Admin Model
- id, name, email, password, role, timestamps

### Faculty Model  
- id, name, department, email, password, otp fields, subjects, assignedStudents, timestamps

### Student Model
- name, rollNumber, registrationNumber, email, facultyId, otp fields, performance metrics, timestamps

## API Endpoints

### POST /api/auth/login
Handles user authentication for all user types.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "userType": "admin|faculty|student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "userType": "admin|faculty|student",
    "collectionName": "collection_name"
  },
  "token": "jwt_token"
}
```

## Seeding Sample Data

Run the following command to seed sample data for testing:

```bash
npm run seed
```

This will create:
- Admin: admin@example.com / password123
- Faculty: faculty@example.com / password123  
- Student: student@example.com / password123

## Authentication Flow

1. User selects login type (Admin/Student/Faculty)
2. System validates credentials against appropriate collection
3. JWT token is generated and stored
4. User is redirected to appropriate dashboard
5. Middleware protects routes based on user type

## Route Protection

- Admin users can only access `/dashboard/admin-dashboard`
- Faculty users can only access `/dashboard/faculty-dashboard`
- Student users can only access `/dashboard/student_dashboard`
- Unauthenticated users are redirected to `/login`

## File Structure

```
├── app/
│   ├── api/auth/login/route.ts    # Login API endpoint
│   └── login/page.tsx             # Updated login page
├── lib/
│   ├── mongodb.ts                 # MongoDB connection utility
│   ├── auth.ts                    # JWT utilities
│   └── auth-utils.ts              # Client-side auth utilities
├── models/
│   ├── Admin.ts                   # Admin Mongoose model
│   ├── Faculty.ts                 # Faculty Mongoose model
│   └── Student.ts                 # Student Mongoose model
├── scripts/
│   └── seed-data.ts               # Data seeding script
└── middleware.ts                  # Route protection middleware
```

## Next Steps

1. Update the MongoDB URI in `.env.local` with your actual password
2. Run `npm run seed` to create test data
3. Start the development server with `npm run dev`
4. Test the login flow with the sample credentials
