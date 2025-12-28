import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    courseId: mongoose.Schema.Types.ObjectId;
    enrolledAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent duplicate enrollment
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
export default Enrollment;
