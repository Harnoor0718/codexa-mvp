import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Get user dashboard stats
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        problemsSolved: true,
        currentStreak: true,
        longestStreak: true,
        lastSolvedDate: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get submission stats
    const totalSubmissions = await prisma.submission.count({
      where: { userId }
    });

    const acceptedSubmissions = await prisma.submission.count({
      where: { userId, status: 'AC' }
    });

    // Get problems by difficulty
    const solvedProblems = await prisma.submission.findMany({
      where: { userId, status: 'AC' },
      distinct: ['problemId'],
      include: { problem: true }
    });

    const easyCount = solvedProblems.filter(s => s.problem.difficulty === 'EASY').length;
    const mediumCount = solvedProblems.filter(s => s.problem.difficulty === 'MEDIUM').length;
    const hardCount = solvedProblems.filter(s => s.problem.difficulty === 'HARD').length;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = await prisma.submission.findMany({
      where: {
        userId,
        submittedAt: { gte: thirtyDaysAgo }
      },
      select: {
        submittedAt: true,
        status: true
      }
    });

    // Calculate acceptance rate
    const acceptanceRate = totalSubmissions > 0 
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100) 
      : 0;

    res.json({
      stats: {
        user: {
          username: user.username,
          memberSince: user.createdAt
        },
        problemsSolved: user.problemsSolved,
        totalSubmissions,
        acceptanceRate,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastSolvedDate: user.lastSolvedDate,
        problemsByDifficulty: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount
        },
        recentActivity: recentSubmissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50' } = req.query;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        problemsSolved: true,
        currentStreak: true,
        longestStreak: true,
        _count: {
          select: {
            submissions: {
              where: { status: 'AC' }
            }
          }
        }
      },
      orderBy: [
        { problemsSolved: 'desc' },
        { longestStreak: 'desc' }
      ],
      take: parseInt(limit as string)
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      problemsSolved: user.problemsSolved,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      acceptedSubmissions: user._count.submissions
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get achievements
export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        problemsSolved: true,
        currentStreak: true,
        longestStreak: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Define achievements
    const achievements = [
      {
        id: 'first_blood',
        title: 'First Blood',
        description: 'Solve your first problem',
        icon: '🎯',
        unlocked: user.problemsSolved >= 1
      },
      {
        id: 'getting_started',
        title: 'Getting Started',
        description: 'Solve 5 problems',
        icon: '🚀',
        unlocked: user.problemsSolved >= 5
      },
      {
        id: 'problem_solver',
        title: 'Problem Solver',
        description: 'Solve 10 problems',
        icon: '💡',
        unlocked: user.problemsSolved >= 10
      },
      {
        id: 'dedicated',
        title: 'Dedicated',
        description: 'Solve 25 problems',
        icon: '⭐',
        unlocked: user.problemsSolved >= 25
      },
      {
        id: 'expert',
        title: 'Expert',
        description: 'Solve 50 problems',
        icon: '🏆',
        unlocked: user.problemsSolved >= 50
      },
      {
        id: 'master',
        title: 'Master',
        description: 'Solve 100 problems',
        icon: '👑',
        unlocked: user.problemsSolved >= 100
      },
      {
        id: 'streak_3',
        title: '3 Day Streak',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        unlocked: user.longestStreak >= 3
      },
      {
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥🔥',
        unlocked: user.longestStreak >= 7
      },
      {
        id: 'streak_30',
        title: 'Monthly Master',
        description: 'Maintain a 30-day streak',
        icon: '🔥🔥🔥',
        unlocked: user.longestStreak >= 30
      },
      {
        id: 'on_fire',
        title: 'On Fire',
        description: 'Current streak of 5+ days',
        icon: '🌟',
        unlocked: user.currentStreak >= 5
      }
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    res.json({
      achievements,
      progress: {
        unlocked: unlockedCount,
        total: achievements.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin Dashboard Stats
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get overall stats
    const totalUsers = await prisma.user.count();
    const totalProblems = await prisma.problem.count();
    const totalSubmissions = await prisma.submission.count();
    const totalDiscussions = await prisma.discussion.count();

    // Get recent activity
    const recentSubmissions = await prisma.submission.findMany({
      take: 10,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { username: true } },
        problem: { select: { title: true, code: true } }
      }
    });

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        problemsSolved: true,
        createdAt: true
      }
    });

    // Problem difficulty distribution
    const problems = await prisma.problem.findMany({
      select: { difficulty: true }
    });

    const difficultyStats = {
      easy: problems.filter(p => p.difficulty === 'EASY').length,
      medium: problems.filter(p => p.difficulty === 'MEDIUM').length,
      hard: problems.filter(p => p.difficulty === 'HARD').length
    };

    // Submission status distribution
    const submissions = await prisma.submission.findMany({
      select: { status: true }
    });

    const statusStats = {
      accepted: submissions.filter(s => s.status === 'AC').length,
      wrongAnswer: submissions.filter(s => s.status === 'WA').length,
      timeLimit: submissions.filter(s => s.status === 'TLE').length,
      runtimeError: submissions.filter(s => s.status === 'RE').length,
      compilationError: submissions.filter(s => s.status === 'CE').length
    };

    res.json({
      stats: {
        totalUsers,
        totalProblems,
        totalSubmissions,
        totalDiscussions,
        difficultyStats,
        statusStats,
        recentSubmissions,
        recentUsers
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};