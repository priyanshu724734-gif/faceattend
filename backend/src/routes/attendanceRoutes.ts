import express from 'express';
import { startSession, stopSession, markAttendance, bulkRecognize, toggleAttendance, getActiveSession } from '../controllers/attendanceController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/start', protect, startSession);
router.post('/stop', protect, stopSession);
router.post('/mark', protect, markAttendance);
router.post('/bulk-recognize', protect, bulkRecognize);
router.post('/toggle', protect, toggleAttendance);
router.get('/active/:courseId', protect, getActiveSession);

export default router;
