import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsAPI } from '../services/api';
import { useToastStore } from '../stores/toastStore';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

interface AdminStats {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  totalDiscussions: number;
  difficultyStats: {
    easy: number;
    medium: number;
    hard: number;
  };
  statusStats: {
    accepted: number;
    wrongAnswer: number;
    timeLimit: number;
    runtimeError: number;
    compilationError: number;
  };
  recentSubmissions: Array<{
    id: number;
    status: string;
    submittedAt: string;
    user: { username: string };
    problem: { title: string; code: string };
  }>;
  recentUsers: Array<{
    id: number;
    username: string;
    email: string;
    problemsSolved: number;
    createdAt: string;
  }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (!user?.isAdmin) {
      addToast('error', 'Admin access required');
      navigate('/');
      return;
    }
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await statsAPI.getAdminStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      addToast('error', 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AC': return 'text-green-600 dark:text-green-400';
      case 'WA': return 'text-red-600 dark:text-red-400';
      case 'TLE': return 'text-yellow-600 dark:text-yellow-400';
      case 'CE': return 'text-orange-600 dark:text-orange-400';
      case 'RE': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400">Failed to load admin dashboard</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Platform overview and statistics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {stats.totalUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {stats.totalProblems}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Problems</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {stats.totalSubmissions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Submissions</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {stats.totalDiscussions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Discussions</div>
          </div>
        </div>

        {/* Problem & Submission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Problem Difficulty Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Problems by Difficulty
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-600 dark:text-green-400 font-medium">Easy</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats.difficultyStats.easy}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Medium</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats.difficultyStats.medium}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600 dark:text-red-400 font-medium">Hard</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats.difficultyStats.hard}
                </span>
              </div>
            </div>
          </div>

          {/* Submission Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Submission Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-600 dark:text-green-400 font-medium">Accepted</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats.statusStats.accepted}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600 dark:text-red-400 font-medium">Wrong Answer</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats.statusStats.wrongAnswer}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Time Limit</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats.statusStats.timeLimit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-600 dark:text-purple-400 font-medium">Runtime Error</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats.statusStats.runtimeError}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-600 dark:text-orange-400 font-medium">Compilation Error</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  {stats.statusStats.compilationError}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Submissions
            </h2>
            <div className="space-y-3">
              {stats.recentSubmissions.map((submission) => (
                <div key={submission.id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {submission.problem.code}: {submission.problem.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        by {submission.user.username}
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Users
            </h2>
            <div className="space-y-3">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user.problemsSolved} solved
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;