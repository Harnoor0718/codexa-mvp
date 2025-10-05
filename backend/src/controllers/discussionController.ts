import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get all discussions for a problem
export const getProblemDiscussions = async (req: AuthRequest, res: Response) => {
  try {
    const { problemId } = req.params;

    const discussions = await prisma.discussion.findMany({
      where: { problemId: parseInt(problemId) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            problemsSolved: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ discussions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new discussion post
export const createDiscussion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { problemId, content } = req.body;

    if (!problemId || !content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Problem ID and content are required' });
    }

    // Check if problem exists
    const problem = await prisma.problem.findUnique({
      where: { id: parseInt(problemId) }
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const discussion = await prisma.discussion.create({
      data: {
        userId,
        problemId: parseInt(problemId),
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            problemsSolved: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Discussion created successfully',
      discussion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a discussion (only by author)
export const deleteDiscussion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const discussion = await prisma.discussion.findUnique({
      where: { id: parseInt(id) }
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    if (discussion.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    await prisma.discussion.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a discussion (only by author)
export const updateDiscussion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: parseInt(id) }
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    if (discussion.userId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }

    const updated = await prisma.discussion.update({
      where: { id: parseInt(id) },
      data: { content: content.trim() },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            problemsSolved: true
          }
        }
      }
    });

    res.json({
      message: 'Discussion updated successfully',
      discussion: updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};