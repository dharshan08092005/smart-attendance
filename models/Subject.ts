import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['theory', 'practical'], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
