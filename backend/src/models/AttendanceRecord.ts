import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceRecord extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    sessionId: mongoose.Schema.Types.ObjectId;
    courseId: mongoose.Schema.Types.ObjectId;
    status: 'PRESENT' | 'ABSENT';
    deviceFingerprint: string;
    ipAddress?: string;
    gpsLocation?: {
        lat: number;
        lng: number;
    };
    distanceFromFaculty?: number;
    vpnDetected?: boolean;
    spoofingDetected?: boolean;
    developerModeDetected?: boolean;
    attendanceMethod: 'FACE' | 'ONE_CLICK' | 'MANUAL';
    fraudFlags?: any;
    timestamp: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT'], required: true },
    deviceFingerprint: { type: String, required: false }, // Optional for manual/bulk
    ipAddress: { type: String },
    gpsLocation: {
        lat: Number,
        lng: Number,
    },
    distanceFromFaculty: Number,
    vpnDetected: Boolean,
    spoofingDetected: Boolean,
    developerModeDetected: Boolean,
    attendanceMethod: { type: String, enum: ['FACE', 'ONE_CLICK', 'MANUAL'], required: true },
    fraudFlags: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent multiple submissions for same session by same student
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
// Prevent multiple submissions from same device for same session
attendanceRecordSchema.index({ sessionId: 1, deviceFingerprint: 1 }, { unique: true });

const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;
