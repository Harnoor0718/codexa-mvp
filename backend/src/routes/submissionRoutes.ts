import express from 'express';
import { submitSolution, getSubmission, getUserSubmissions, getProblemSubmissions, testCustomInput } from '../controllers/submissionController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.post('/', authMiddleware, submitSolution);
router.post('/test', authMiddleware, testCustomInput);
router.get('/:id', authMiddleware, getSubmission);
router.get('/user/me', authMiddleware, getUserSubmissions);
router.get('/problem/:problemId', authMiddleware, getProblemSubmissions);

export default router;