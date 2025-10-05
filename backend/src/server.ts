import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import problemRoutes from './routes/problemRoutes';
import submissionRoutes from './routes/submissionRoutes';
import statsRoutes from './routes/statsRoutes';
import discussionRoutes from './routes/discussionRoutes';
import passwordResetRoutes from './routes/passwordResetRoutes';

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

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Codexa API is running',
    timestamp: new Date().toISOString(),
    envLoaded: !!process.env.JUDGE0_API_KEY
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/password-reset', passwordResetRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});