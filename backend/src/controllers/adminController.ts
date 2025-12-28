import { Request, Response } from 'express';
import User from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

// @desc    Get Admin Stats
// @route   GET /api/admin/stats
export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const studentCount = await User.countDocuments({ role: 'STUDENT' });
        const facultyCount = await User.countDocuments({ role: 'FACULTY' });
        const courseCount = await Course.countDocuments();

        res.json({
            students: studentCount,
            faculty: facultyCount,
            courses: courseCount
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create User (Bulk or Single)
// @route   POST /api/admin/users
export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, enrollmentNumber, password, role } = req.body;

        const userExists = await User.findOne({ $or: [{ email }, { enrollmentNumber }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            enrollmentNumber,
            passwordHash: password || '123456',
            role
        });

        res.status(201).json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
