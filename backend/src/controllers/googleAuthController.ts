import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const { email, name, googleId } = req.user as any;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user with Google account
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
      
      user = await prisma.user.create({
        data: {
          username,
          email,
          password: crypto.randomBytes(32).toString('hex'), // Random password since they use Google
          fullName: name,
          isEmailVerified: true, // Google emails are already verified
        }
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      problemsSolved: user.problemsSolved,
      isAdmin: user.isAdmin,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    }))}`);
  } catch (error) {
    console.error('Google auth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=authentication_failed`);
  }
};