import express from 'express';
import { getAdminStats, getAllUsers, createUser } from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/users', createUser);

export default router;
