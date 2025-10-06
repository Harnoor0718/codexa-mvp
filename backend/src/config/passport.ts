import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        googleId: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
      };
      return done(null, user);
    }
  )
);

export default passport;