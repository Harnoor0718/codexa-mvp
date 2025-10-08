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
  const [problems, setProblems] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
    fetchProblems();
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

  const fetchProblems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/problems', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProblems(data.problems || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  const handleDeleteProblem = async (problemId: number) => {
    if (!window.confirm('Are you sure you want to delete this problem? This will also delete all related submissions and test cases.')) {
      return;
    }

    console.log('🟢 Starting delete for problem:', problemId);
    setDeletingId(problemId);
    try {
      const token = localStorage.getItem('token');
      console.log('🟢 Token exists:', !!token);
      console.log('🟢 Making DELETE request to:', `http://localhost:5000/api/problems/${problemId}`);
      
      const response = await fetch(`http://localhost:5000/api/problems/${problemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🟢 Response status:', response.status);
      console.log('🟢 Response ok:', response.ok);

      if (response.ok) {
        addToast('success', 'Problem deleted successfully');
        // Remove from local state
        setProblems(problems.filter(p => p.id !== problemId));
        // Refresh stats
        fetchAdminStats();
      } else {
        const data = await response.json();
        console.log('❌ Error response:', data);
        addToast('error', data.error || 'Failed to delete problem');
      }
    } catch (error) {
      console.error('❌ Error deleting problem:', error);
      addToast('error', 'Failed to delete problem');
    } finally {
      setDeletingId(null);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        {/* Manage Problems Section */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Manage Problems
              </h2>
              <button
                onClick={() => navigate('/create-problem')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Create Problem
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Difficulty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Submissions
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {problems.map((problem) => (
                    <tr key={problem.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {problem.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {problem.title}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          problem.difficulty === 'EASY' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : problem.difficulty === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {problem._count?.submissions || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <button
                          onClick={() => navigate(`/problems/${problem.id}`)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteProblem(problem.id)}
                          disabled={deletingId === problem.id}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingId === problem.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {problems.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No problems found. Create your first problem!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;