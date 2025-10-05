import express from 'express';
import { 
  getProblems, 
  getProblem, 
  createProblem, 
  updateProblem, 
  deleteProblem,
  getAllTags 
} from '../controllers/problemController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getProblems);
router.get('/tags/all', authMiddleware, getAllTags);
router.get('/:id', authMiddleware, getProblem);

// Admin routes
router.post('/', authMiddleware, createProblem);
router.put('/:id', authMiddleware, updateProblem);
router.delete('/:id', authMiddleware, deleteProblem);

export default router;