import express from 'express';
import { getUserStats, getLeaderboard, getAchievements, getAdminStats } from '../controllers/statsController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/user', authMiddleware, getUserStats);
router.get('/leaderboard', authMiddleware, getLeaderboard);
router.get('/achievements', authMiddleware, getAchievements);
router.get('/admin', authMiddleware, getAdminStats);

export default router;