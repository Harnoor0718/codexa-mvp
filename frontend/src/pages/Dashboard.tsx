import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsAPI } from '../services/api';
import { useToastStore } from '../stores/toastStore';
import Spinner from '../components/Spinner';

interface Stats {
  user: {
    username: string;
    memberSince: string;
  };
  problemsSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  currentStreak: number;
  longestStreak: number;
  lastSolvedDate: string | null;
  problemsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  recentActivity: Array<{
    submittedAt: string;
    status: string;
  }>;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState({ unlocked: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, achievementsRes] = await Promise.all([
        statsAPI.getUserStats(),
        statsAPI.getAchievements()
      ]);

      setStats(statsRes.data.stats);
      setAchievements(achievementsRes.data.achievements);
      setAchievementProgress(achievementsRes.data.progress);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityHeatmap = () => {
    if (!stats) return [];

    const heatmap: { [key: string]: number } = {};
    stats.recentActivity.forEach(activity => {
      const date = new Date(activity.submittedAt).toISOString().split('T')[0];
      heatmap[date] = (heatmap[date] || 0) + 1;
    });

    // Generate last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: heatmap[dateStr] || 0
      });
    }

    return days;
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (count <= 2) return 'bg-green-200 dark:bg-green-900';
    if (count <= 5) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-600 dark:bg-green-500';
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
        <div className="text-red-600 dark:text-red-400">Failed to load dashboard</div>
      </div>
    );
  }

  const heatmapData = getActivityHeatmap();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {stats.user.username}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Member since {new Date(stats.user.memberSince).toLocaleDateString()}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {stats.problemsSolved}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Problems Solved</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {stats.acceptanceRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Acceptance Rate</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.currentStreak}
              </span>
              <span className="text-2xl">🔥</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {stats.longestStreak}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
          </div>
        </div>

        {/* Progress by Difficulty */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Problems by Difficulty
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {stats.problemsByDifficulty.easy}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {stats.problemsByDifficulty.medium}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {stats.problemsByDifficulty.hard}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Hard</div>
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Activity (Last 30 Days)
          </h2>
          <div className="grid grid-cols-10 gap-2">
            {heatmapData.map((day, index) => (
              <div
                key={index}
                className={`w-full aspect-square rounded ${getHeatmapColor(day.count)}`}
                title={`${day.date}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900"></div>
            <div className="w-3 h-3 rounded bg-green-400 dark:bg-green-700"></div>
            <div className="w-3 h-3 rounded bg-green-600 dark:bg-green-500"></div>
            <span>More</span>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements</h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {achievementProgress.unlocked} / {achievementProgress.total} unlocked
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`text-center p-4 rounded-lg border-2 transition ${
                  achievement.unlocked
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {achievement.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {achievement.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Solve Problems
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;