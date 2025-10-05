import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data: { username: string; email: string; password: string; adminPassword?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
};

// Problem APIs
// Problem APIs
export const problemAPI = {
  getAll: (params?: { difficulty?: string; search?: string; tags?: string; status?: string }) => 
    api.get('/problems', { params }),
  getById: (id: number) => api.get(`/problems/${id}`),
  getAllTags: () => api.get('/problems/tags/all'),
  
  // Admin endpoints
  create: (data: { 
    code: string; 
    title: string; 
    description: string; 
    difficulty: string; 
    timeLimit?: number; 
    memoryLimit?: number; 
    tags?: string; 
    testCases: Array<{ input: string; expectedOutput: string; isSample: boolean }> 
  }) => api.post('/problems', data),
  update: (id: number, data: any) => api.put(`/problems/${id}`, data),
  delete: (id: number) => api.delete(`/problems/${id}`),
};

// Submission APIs
export const submissionAPI = {
  submit: (data: { problemId: number; code: string; language: string }) =>
    api.post('/submissions', data),
  getById: (id: number) => api.get(`/submissions/${id}`),
  getUserSubmissions: () => api.get('/submissions/user/me'),
  getProblemSubmissions: (problemId: number) => api.get(`/submissions/problem/${problemId}`),
  testCustomInput: (data: { code: string; language: string; input: string }) =>
    api.post('/submissions/test', data),
};

// Stats APIs
// Stats APIs
export const statsAPI = {
  getUserStats: () => api.get('/stats/user'),
  getLeaderboard: (limit?: number) => api.get('/stats/leaderboard', { params: { limit } }),
  getAchievements: () => api.get('/stats/achievements'),
  getAdminStats: () => api.get('/stats/admin'),
};

// Discussion APIs
export const discussionAPI = {
  getProblemDiscussions: (problemId: number) => api.get(`/discussions/problem/${problemId}`),
  createDiscussion: (data: { problemId: number; content: string }) => api.post('/discussions', data),
  updateDiscussion: (id: number, content: string) => api.put(`/discussions/${id}`, { content }),
  deleteDiscussion: (id: number) => api.delete(`/discussions/${id}`),
};

// Password Reset APIs
export const passwordResetAPI = {
  requestReset: (email: string) => api.post('/password-reset/request', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/password-reset/reset', { token, newPassword }),
};

export default api;