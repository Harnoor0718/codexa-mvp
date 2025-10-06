import express from 'express';
import passport from '../config/passport';
import { googleAuthCallback } from '../controllers/googleAuthController';

const router = express.Router();

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login'
  }),
  googleAuthCallback
);

export default router;