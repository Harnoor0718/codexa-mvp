import express from 'express';
import { 
  getProblemDiscussions, 
  createDiscussion, 
  deleteDiscussion, 
  updateDiscussion 
} from '../controllers/discussionController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/problem/:problemId', authMiddleware, getProblemDiscussions);
router.post('/', authMiddleware, createDiscussion);
router.put('/:id', authMiddleware, updateDiscussion);
router.delete('/:id', authMiddleware, deleteDiscussion);

export default router;