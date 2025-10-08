import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getProblems = async (req: AuthRequest, res: Response) => {
  try {
    const { difficulty, search, tags, status } = req.query;
    const userId = req.userId;

    const where: any = { isPublished: true };

    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty;
    }

    // Filter by tags
    if (tags) {
      where.tags = { contains: tags as string };
    }

    // Search by title, code, or tags
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { code: { contains: search as string } },
        { tags: { contains: search as string } }
      ];
    }

    const problems = await prisma.problem.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        difficulty: true,
        tags: true,
        timeLimit: true,
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get user's solved problems if filtering by status
    let solvedProblemIds: number[] = [];
    if (userId && status) {
      const solvedSubmissions = await prisma.submission.findMany({
        where: {
          userId,
          status: 'AC'
        },
        select: {
          problemId: true
        },
        distinct: ['problemId']
      });
      solvedProblemIds = solvedSubmissions.map(s => s.problemId);
    }

    // Filter by solved/unsolved status
    let filteredProblems = problems;
    if (status === 'solved' && userId) {
      filteredProblems = problems.filter(p => solvedProblemIds.includes(p.id));
    } else if (status === 'unsolved' && userId) {
      filteredProblems = problems.filter(p => !solvedProblemIds.includes(p.id));
    }

    // Add solved status to each problem
    const problemsWithStatus = filteredProblems.map(problem => ({
      ...problem,
      isSolved: userId ? solvedProblemIds.includes(problem.id) : false
    }));

    res.json({ problems: problemsWithStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProblem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id: parseInt(id) },
      include: {
        testCases: {
          where: { isSample: true }
        }
      }
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json({ problem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProblem = async (req: AuthRequest, res: Response) => {
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

    const { code, title, description, difficulty, timeLimit, memoryLimit, tags, testCases } = req.body;

    // Validate required fields
    if (!code || !title || !description || !difficulty || !testCases || testCases.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create problem with test cases
    const problem = await prisma.problem.create({
      data: {
        code,
        title,
        description,
        difficulty,
        timeLimit: timeLimit || 1000,
        memoryLimit: memoryLimit || 256,
        tags: tags || '',
        isPublished: true,
        testCases: {
          create: testCases.map((tc: any) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: tc.isSample || false
          }))
        }
      },
      include: { testCases: true }
    });

    res.status(201).json({
      message: 'Problem created successfully',
      problem
    });
  } catch (error: any) {
    console.error('Error creating problem:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Problem code already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProblem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, description, difficulty, timeLimit, memoryLimit, tags, isPublished } = req.body;

    const problem = await prisma.problem.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        difficulty,
        timeLimit,
        memoryLimit,
        tags,
        isPublished
      }
    });

    res.json({
      message: 'Problem updated successfully',
      problem
    });
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProblem = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟢 DELETE PROBLEM - Start');
    
    const userId = req.userId!;
    const { id } = req.params;
    
    console.log('🟢 Problem ID:', id);
    console.log('🟢 User ID:', userId);
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, username: true }
    });

    console.log('🟢 User found:', user ? 'Yes' : 'No');
    console.log('🟢 Is admin:', user?.isAdmin);

    if (!user?.isAdmin) {
      console.log('❌ User is not admin');
      return res.status(403).json({ error: 'Admin access required' });
    }

    const problemId = parseInt(id);
    
    if (isNaN(problemId)) {
      console.log('❌ Invalid problem ID');
      return res.status(400).json({ error: 'Invalid problem ID' });
    }

    // Check if problem exists
    const problem = await prisma.problem.findUnique({
      where: { id: problemId }
    });

    if (!problem) {
      console.log('❌ Problem not found');
      return res.status(404).json({ error: 'Problem not found' });
    }

    console.log('🟢 Problem found:', problem.title);
    console.log('🟢 Deleting submissions...');
    
    // Delete related records first
    const deletedSubmissions = await prisma.submission.deleteMany({
      where: { problemId }
    });
    console.log('🟢 Deleted submissions:', deletedSubmissions.count);
    
    console.log('🟢 Deleting test cases...');
    const deletedTestCases = await prisma.testCase.deleteMany({
      where: { problemId }
    });
    console.log('🟢 Deleted test cases:', deletedTestCases.count);

    console.log('🟢 Deleting problem...');
    await prisma.problem.delete({
      where: { id: problemId }
    });

    console.log('✅ Problem deleted successfully');
    res.json({ 
      message: 'Problem deleted successfully',
      deletedSubmissions: deletedSubmissions.count,
      deletedTestCases: deletedTestCases.count
    });
  } catch (error) {
    console.error('❌ Error deleting problem:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAllTags = async (req: AuthRequest, res: Response) => {
  try {
    const problems = await prisma.problem.findMany({
      where: { isPublished: true },
      select: { tags: true }
    });

    // Extract and deduplicate tags
    const tagsSet = new Set<string>();
    problems.forEach(problem => {
      if (problem.tags) {
        const tagArray = problem.tags.split(',').map(tag => tag.trim());
        tagArray.forEach(tag => tagsSet.add(tag));
      }
    });

    const uniqueTags = Array.from(tagsSet).sort();

    res.json({ tags: uniqueTags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};