import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceSession extends Document {
    facultyId: mongoose.Schema.Types.ObjectId;
    courseId: mongoose.Schema.Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    facultyLocation?: {
        lat: number;
        lng: number;
    };
    attendanceMethod: 'FACE' | 'ONE_CLICK';
    status: 'ACTIVE' | 'CLOSED';
}

const attendanceSessionSchema = new Schema<IAttendanceSession>({
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    facultyLocation: {
        lat: { type: Number },
        lng: { type: Number },
    },
    attendanceMethod: { type: String, enum: ['FACE', 'ONE_CLICK'], required: true },
    status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
}, { timestamps: true });

const AttendanceSession = mongoose.model<IAttendanceSession>('AttendanceSession', attendanceSessionSchema);
export default AttendanceSession;
