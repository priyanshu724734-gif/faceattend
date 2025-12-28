import express from 'express';
import { registerFace, getFaceStatus } from '../controllers/faceController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', protect, registerFace);
router.get('/status', protect, getFaceStatus);

export default router;
