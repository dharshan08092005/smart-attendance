import mongoose from 'mongoose';

const FacultySchema = new mongoose.Schema({
  // Basic Information
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Contact Information
  phone: { type: String },
  office: { type: String },
  designation: { type: String, default: 'Assistant Professor' },
  
  // OTP System
  otp: { type: String },
  otpGeneratedAt: { type: Date },
  otpExpiresAt: { type: Date },
  otpPeriod: { type: String },
  otpSubjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  
  // Academic Information
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }], // Specific mentees for guidance
  
  // Timetable Information
  timetable: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    hour: { type: String }, // e.g., "09:00-10:00"
    subject: { type: String },
    room: { type: String },
    type: { type: String, enum: ['theory', 'practical', 'lab'] }
  }],
  
  // Performance Metrics
  totalStudents: { type: Number, default: 0 },
  activeStudents: { type: Number, default: 0 },
  averageAttendance: { type: Number, default: 0 },
  
  // Status and Timestamps
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for better query performance
FacultySchema.index({ email: 1 });
FacultySchema.index({ department: 1 });
FacultySchema.index({ isActive: 1 });

export default mongoose.models.Faculty || mongoose.model('Faculty', FacultySchema);
