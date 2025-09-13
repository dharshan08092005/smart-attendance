import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  registrationNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  otp: { type: String },
  otpGeneratedAt: { type: Date },
  attendancePercentage: { type: Number, default: 0 },
  GPA: { type: Number, default: 0 },
  leavesInLastMonth: { type: Number, default: 0 },
  otpMissRate: { type: Number, default: 0 },
  engagementRiskScore: { type: Number },
  studyPerformance: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String },
    marks: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }],
  performancePrediction: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    predictedMark: { type: Number },
    trend: { type: String, enum: ['Improving', 'Declining'] },
    confidenceScore: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }],
  attendanceRecords: [{
    date: { type: String, required: true },
    period: { type: String, required: true },
    hour: { type: Number, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    method: { type: String, enum: ['otp', 'qr', 'manual'], required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    markedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
