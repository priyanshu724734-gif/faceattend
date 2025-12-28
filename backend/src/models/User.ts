import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email?: string;
    enrollmentNumber?: string;
    passwordHash: string;
    role: 'FACULTY' | 'STUDENT' | 'ADMIN';
    profileImageUrl?: string;
    academicYear?: string;
    isActive: boolean;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    enrollmentNumber: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['FACULTY', 'STUDENT', 'ADMIN'], required: true },
    profileImageUrl: { type: String },
    academicYear: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Use async/await without next for pre-save hook
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
