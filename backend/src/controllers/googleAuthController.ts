import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    console.log('🔵 Google callback triggered');
    console.log('🔵 User from Google:', req.user);
    
    const { email, name, googleId } = req.user as any;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('🔵 Existing user found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('🔵 User details:', { id: user.id, email: user.email, username: user.username });
    }

    if (!user) {
      // Create new user with Google account
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(7);
      
      console.log('🔵 Creating new user with username:', username);
      
      user = await prisma.user.create({
        data: {
          username,
          email,
          password: crypto.randomBytes(32).toString('hex'), // Random password since they use Google
          fullName: name,
          isEmailVerified: true, // Google emails are already verified
        }
      });
      console.log('✅ New user created:', { id: user.id, email: user.email, username: user.username });
    }

    // Generate JWT token
    const token = generateToken(user.id);
    console.log('✅ Token generated:', token.substring(0, 20) + '...');

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      problemsSolved: user.problemsSolved,
      isAdmin: user.isAdmin,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    }))}`;
    
    console.log('✅ Redirecting to:', redirectUrl.substring(0, 100) + '...');
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Google auth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=authentication_failed`);
  }
};