import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { submitCode, getVerdict } from '../services/judgeService';

const prisma = new PrismaClient();

export const submitSolution = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { problemId, code, language } = req.body;

    console.log('=== NEW SUBMISSION ===');
    console.log('User ID:', userId);
    console.log('Problem ID:', problemId);
    console.log('Language:', language);

    // Validate input
    if (!problemId || !code || !language) {
      return res.status(400).json({ 
        error: 'Missing required fields: problemId, code, or language' 
      });
    }

    // Get problem with test cases
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true }
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    console.log(`Found ${problem.testCases.length} test cases`);

    let passedTestCases = 0;
    let totalTestCases = problem.testCases.length;
    let finalStatus = 'AC';
    let totalRuntime = 0;
    let totalMemory = 0;

    // Run code against all test cases
    for (let i = 0; i < problem.testCases.length; i++) {
      const testCase = problem.testCases[i];
      console.log(`\n--- Test Case ${i + 1} ---`);
      console.log('Input:', testCase.input);
      console.log('Expected:', testCase.expectedOutput);

      try {
        const result = await submitCode(code, language, testCase.input);
        console.log('Judge0 Response:', {
          status: result.status,
          stdout: result.stdout,
          stderr: result.stderr,
          time: result.time,
          memory: result.memory
        });

        const verdict = getVerdict(result.status.id);
        
        if (verdict !== 'AC') {
          finalStatus = verdict;
          console.log(`Test case ${i + 1} failed with verdict: ${verdict}`);
          break;
        }

        if (verdict === 'AC' && result.stdout?.trim() === testCase.expectedOutput.trim()) {
          passedTestCases++;
          totalRuntime += result.time ? parseFloat(result.time) * 1000 : 0;
          totalMemory += result.memory ? parseInt(result.memory) : 0;
          console.log(`✓ Test case ${i + 1} passed`);
        } else {
          finalStatus = verdict;
          console.log(`✗ Test case ${i + 1} failed`, verdict);
          console.log('Expected:', testCase.expectedOutput.trim());
          console.log('Got:', result.stdout?.trim());
          break;
        }
      } catch (testError: any) {
        console.error(`Error on test case ${i + 1}:`, testError.message);
        finalStatus = 'RE';
        break;
      }
    }

    // Create submission record
    const avgRuntime = passedTestCases > 0 ? Math.round(totalRuntime / passedTestCases) : 0;
    const avgMemory = passedTestCases > 0 ? Math.round(totalMemory / passedTestCases) : 0;

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status: finalStatus,
        runtime: avgRuntime,
        memory: avgMemory
      }
    });

    console.log('\n=== SUBMISSION RESULT ===');
    console.log('Status:', finalStatus);
    console.log('Passed:', passedTestCases, '/', totalTestCases);

    // Update user's problems solved count and streak if this is their first AC for this problem
    if (finalStatus === 'AC') {
      const previousAC = await prisma.submission.findFirst({
        where: {
          userId,
          problemId,
          status: 'AC',
          id: { not: submission.id }
        }
      });

      if (!previousAC) {
        // Get current user data
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { lastSolvedDate: true, currentStreak: true, longestStreak: true }
        });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let newStreak = 1;
        let newLongestStreak = user?.longestStreak || 0;

        if (user?.lastSolvedDate) {
          const lastSolved = new Date(user.lastSolvedDate);
          const lastSolvedDay = new Date(lastSolved.getFullYear(), lastSolved.getMonth(), lastSolved.getDate());
          const diffDays = Math.floor((today.getTime() - lastSolvedDay.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            // Same day - keep current streak
            newStreak = user.currentStreak;
          } else if (diffDays === 1) {
            // Consecutive day - increment streak
            newStreak = user.currentStreak + 1;
          } else {
            // Streak broken - reset to 1
            newStreak = 1;
          }
        }

        // Update longest streak if current is higher
        if (newStreak > newLongestStreak) {
          newLongestStreak = newStreak;
        }

        await prisma.user.update({
          where: { id: userId },
          data: { 
            problemsSolved: { increment: 1 },
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastSolvedDate: now
          }
        });

        console.log('Updated user stats - Streak:', newStreak);
      }
    }

    res.json({
      message: 'Submission completed',
      submission: {
        id: submission.id,
        status: finalStatus,
        passedTestCases,
        totalTestCases,
        runtime: avgRuntime,
        memory: avgMemory
      }
    });
  } catch (error: any) {
    console.error('=== SUBMISSION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({ 
      error: 'Submission failed',
      details: error.message 
    });
  }
};

export const getSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id) },
      include: {
        problem: {
          select: {
            id: true,
            code: true,
            title: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: {
        problem: {
          select: {
            code: true,
            title: true,
            difficulty: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 50
    });

    res.json({ submissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProblemSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { problemId } = req.params;

    const submissions = await prisma.submission.findMany({
      where: { 
        userId,
        problemId: parseInt(problemId)
      },
      orderBy: { submittedAt: 'desc' },
      take: 20 // Last 20 submissions for this problem
    });

    res.json({ submissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const testCustomInput = async (req: AuthRequest, res: Response) => {
  try {
    const { code, language, input } = req.body;

    console.log('=== Custom Test ===');
    console.log('Language:', language);
    console.log('Input:', input);

    // Validate input
    if (!code || !language || input === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: code, language, or input' 
      });
    }

    // Run code with custom input
    const result = await submitCode(code, language, input);
    
    console.log('Judge0 result:', {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output
    });

    const verdict = getVerdict(result.status.id);
    const runtime = result.time ? parseFloat(result.time) * 1000 : 0;
    const memory = result.memory ? parseInt(result.memory) : 0;

    res.json({
      result: {
        status: verdict,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compile_output: result.compile_output || '',
        runtime: Math.round(runtime),
        memory: memory,
        statusDescription: result.status.description
      }
    });
  } catch (error: any) {
    console.error('=== CUSTOM TEST ERROR ===');
    console.error('Error message:', error.message);
    
    res.status(500).json({ 
      error: 'Test execution failed',
      details: error.message 
    });
  }
};