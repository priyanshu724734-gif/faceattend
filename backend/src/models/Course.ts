import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
    courseCode: string;
    courseName: string;
    classTiming: string;
    facultyId: mongoose.Schema.Types.ObjectId;
}

const courseSchema = new Schema<ICourse>({
    courseCode: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
    classTiming: { type: String, required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Course = mongoose.model<ICourse>('Course', courseSchema);
export default Course;
