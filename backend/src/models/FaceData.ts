import mongoose, { Document, Schema } from 'mongoose';

export interface IFaceData extends Document {
    studentId: mongoose.Schema.Types.ObjectId;
    embeddings: number[];
    registeredAt: Date;
}

const faceDataSchema = new Schema<IFaceData>({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    embeddings: { type: [Number], required: true }, // Array of numbers from ArcFace
    registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

const FaceData = mongoose.model<IFaceData>('FaceData', faceDataSchema);
export default FaceData;
