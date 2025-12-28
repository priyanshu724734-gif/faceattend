import express from 'express';
import { getCourses } from '../controllers/courseController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getCourses);

export default router;
