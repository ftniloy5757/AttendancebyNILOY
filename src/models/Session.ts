import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    email: { type: String, required: true },
    section: { type: String, required: true },
    ip: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
    className: { type: String, required: true },
    teacherEmail: { type: String, required: true },
    allowedIp: { type: String, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    endTime: { type: Date },
    attendance: [AttendanceSchema]
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
