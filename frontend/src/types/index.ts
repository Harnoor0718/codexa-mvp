export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  problemsSolved: number;
  createdAt: string;
  isAdmin: boolean;
  isEmailVerified: boolean;  
}

export interface Problem {
  id: number;
  code: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  memoryLimit: number;
  testCases?: TestCase[];
}

export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Submission {
  id: number;
  userId: number;
  problemId: number;
  code: string;
  language: string;
  status: 'AC' | 'WA' | 'TLE' | 'CE' | 'RE' | 'PENDING';
  runtime: number;
  memory: number;
  submittedAt: string;
  problem?: {
    code: string;
    title: string;
    difficulty: string;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, adminPassword?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}