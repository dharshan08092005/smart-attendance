import mongoose from 'mongoose';

const FacultySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String },
  otpGeneratedAt: { type: Date },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Faculty || mongoose.model('Faculty', FacultySchema);
