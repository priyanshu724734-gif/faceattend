import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AttendanceSession from '../models/AttendanceSession';
import AttendanceRecord from '../models/AttendanceRecord';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get all students registered for a course
// @route   GET /api/reports/:courseId/students
export const getCourseStudents = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const enrollments = await Enrollment.find({ courseId: courseId as any }).populate('studentId', 'name enrollmentNumber');

        const totalSessions = await AttendanceSession.countDocuments({
            courseId: courseId as any,
            status: 'CLOSED'
        });

        const studentsWithStats = await Promise.all(enrollments.map(async (enrollment: any) => {
            const attendedCount = await AttendanceRecord.countDocuments({
                studentId: enrollment.studentId._id,
                courseId: courseId as any,
                status: 'PRESENT'
            });

            const percentage = totalSessions === 0 ? 0 : (attendedCount / totalSessions) * 100;

            return {
                _id: enrollment.studentId._id,
                name: enrollment.studentId.name,
                enrollmentNumber: enrollment.studentId.enrollmentNumber,
                attendancePercentage: percentage.toFixed(1)
            };
        }));

        res.json({
            totalClasses: totalSessions,
            students: studentsWithStats
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance history for a course
// @route   GET /api/reports/:courseId/history
export const getCourseHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID' });
        }

        const sessions = await AttendanceSession.find({
            courseId: courseId as any
        }).sort({ startTime: -1 });

        const history = await Promise.all(sessions.map(async (session) => {
            const presentCount = await AttendanceRecord.countDocuments({ sessionId: session._id as any, status: 'PRESENT' });
            const totalEnrolled = await Enrollment.countDocuments({ courseId: courseId as any });

            return {
                _id: session._id,
                date: session.startTime,
                method: session.attendanceMethod,
                presentCount,
                absentCount: totalEnrolled - presentCount,
                attendancePercentage: totalEnrolled === 0 ? 0 : ((presentCount / totalEnrolled) * 100).toFixed(1)
            };
        }));

        res.json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get details of a specific attendance session
// @route   GET /api/reports/session/:sessionId
export const getSessionDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { sessionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({ message: 'Invalid Session ID' });
        }

        const session = await AttendanceSession.findById(sessionId).populate('courseId');
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const enrollments = await Enrollment.find({
            courseId: (session.courseId as any)._id
        }).populate('studentId', 'name enrollmentNumber');

        const records = await AttendanceRecord.find({
            sessionId: sessionId as any
        });

        const studentList = enrollments.map((enrollment: any) => {
            const record = records.find(r => r.studentId.toString() === enrollment.studentId._id.toString());
            return {
                _id: enrollment.studentId._id,
                name: enrollment.studentId.name,
                enrollmentNumber: enrollment.studentId.enrollmentNumber,
                status: record ? 'PRESENT' : 'ABSENT'
            };
        });

        res.json({
            session,
            students: studentList
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's own attendance details for a course
// @route   GET /api/reports/:courseId/student-details
export const getStudentCourseDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID' });
        }

        const sessions = await AttendanceSession.find({
            courseId: courseId as any
        }).sort({ startTime: 1 });

        const records = await AttendanceRecord.find({
            courseId: courseId as any,
            studentId: studentId as any
        });

        const history = sessions.map(session => {
            const record = records.find(r => r.sessionId.toString() === session._id.toString());
            return {
                date: session.startTime,
                status: record ? 'PRESENT' : 'ABSENT',
                attendanceTaken: session.status === 'CLOSED'
            };
        });

        res.json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
