import { Request, Response } from 'express';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import AttendanceSession from '../models/AttendanceSession';
import AttendanceRecord from '../models/AttendanceRecord';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Get courses for logged in user
// @route   GET /api/courses
// @access  Private
export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (user.role === 'FACULTY') {
            const courses = await Course.find({ facultyId: user._id });

            // Get student count for each course
            const coursesWithCount = await Promise.all(courses.map(async (course: any) => {
                const count = await Enrollment.countDocuments({ courseId: course._id });
                return { ...course.toObject(), studentCount: count };
            }));

            res.json(coursesWithCount);
        } else if (user.role === 'STUDENT') {
            const enrollments = await Enrollment.find({ studentId: user._id }).populate('courseId');

            const coursesWithStats = await Promise.all(enrollments.map(async (enrollment: any) => {
                if (!enrollment.courseId) return null; // Handle deleted courses
                const courseId = enrollment.courseId._id;

                // Total sessions for this course
                const totalSessions = await AttendanceSession.countDocuments({
                    courseId: courseId
                });

                // Attended sessions
                const attendedCount = await AttendanceRecord.countDocuments({
                    studentId: user._id,
                    courseId: courseId,
                    status: 'PRESENT'
                });

                const percentage = totalSessions === 0 ? 0 : (attendedCount / totalSessions) * 100;

                return {
                    ...enrollment.courseId.toObject(),
                    stats: {
                        totalClasses: totalSessions,
                        attendedClasses: attendedCount,
                        missedClasses: totalSessions - attendedCount,
                        attendancePercentage: percentage.toFixed(1)
                    }
                };
            }));

            res.json(coursesWithStats.filter(c => c !== null));
        } else {
            res.status(403).json({ message: 'Not authorized' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
