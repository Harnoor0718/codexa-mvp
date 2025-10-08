import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import problemRoutes from './routes/problemRoutes';
import submissionRoutes from './routes/submissionRoutes';
import statsRoutes from './routes/statsRoutes';
import discussionRoutes from './routes/discussionRoutes';
import passwordResetRoutes from './routes/passwordResetRoutes';
import googleAuthRoutes from './routes/googleAuthRoutes';

// Force load .env file
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  console.error('Looking for .env at:', envPath);
} else {
  console.log('✅ Environment variables loaded:', Object.keys(result.parsed || {}));
  console.log('JUDGE0_API_KEY present:', !!process.env.JUDGE0_API_KEY);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());

// Passport
app.use(passport.initialize());

// CRITICAL: Global request logger - must be BEFORE routes
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('📥 INCOMING REQUEST:', req.method, req.path);
  console.log('   Authorization:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Codexa API is running',
    timestamp: new Date().toISOString(),
    envLoaded: !!process.env.JUDGE0_API_KEY
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/password-reset', passwordResetRoutes);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ GLOBAL ERROR:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log('📝 Request logging enabled');
});