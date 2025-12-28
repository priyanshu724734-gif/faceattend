import express from 'express';
import { loginUser, logoutUser, changePassword, refreshAccessToken } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/refresh', refreshAccessToken);
router.post('/change-password', protect, changePassword);

export default router;
