import express from 'express';
import {
    getCourseStudents,
    getCourseHistory,
    getSessionDetails,
    getStudentCourseDetails
} from '../controllers/reportController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:courseId/students', protect, getCourseStudents);
router.get('/:courseId/history', protect, getCourseHistory);
router.get('/:courseId/student-details', protect, getStudentCourseDetails);
router.get('/session/:sessionId', protect, getSessionDetails);

export default router;
