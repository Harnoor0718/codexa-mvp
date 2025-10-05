import { useState, useEffect } from 'react';
import { discussionAPI } from '../services/api';
import { useToastStore } from '../stores/toastStore';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

interface Discussion {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    problemsSolved: number;
  };
}

interface DiscussionSectionProps {
  problemId: number;
}

const DiscussionSection: React.FC<DiscussionSectionProps> = ({ problemId }) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const { user } = useAuth();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchDiscussions();
  }, [problemId]);

  const fetchDiscussions = async () => {
    try {
      const response = await discussionAPI.getProblemDiscussions(problemId);
      setDiscussions(response.data.discussions);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      addToast('error', 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await discussionAPI.createDiscussion({
        problemId,
        content: newComment
      });
      setDiscussions([response.data.discussion, ...discussions]);
      setNewComment('');
      addToast('success', 'Comment posted successfully');
    } catch (error) {
      addToast('error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editContent.trim()) return;

    try {
      const response = await discussionAPI.updateDiscussion(id, editContent);
      setDiscussions(discussions.map(d => 
        d.id === id ? response.data.discussion : d
      ));
      setEditingId(null);
      setEditContent('');
      addToast('success', 'Comment updated');
    } catch (error) {
      addToast('error', 'Failed to update comment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await discussionAPI.deleteDiscussion(id);
      setDiscussions(discussions.filter(d => d.id !== id));
      addToast('success', 'Comment deleted');
    } catch (error) {
      addToast('error', 'Failed to delete comment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="medium" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Discussion ({discussions.length})
      </h2>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts, solutions, or ask questions..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
          rows={4}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Spinner size="small" color="border-white" />}
            Post Comment
          </button>
        </div>
      </form>

      {/* Discussion List */}
      <div className="space-y-4">
        {discussions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No discussions yet. Be the first to share your thoughts!
          </div>
        ) : (
          discussions.map((discussion) => (
            <div
              key={discussion.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {discussion.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {discussion.user.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {discussion.user.problemsSolved} problems solved • {formatDate(discussion.createdAt)}
                      {discussion.createdAt !== discussion.updatedAt && ' (edited)'}
                    </div>
                  </div>
                </div>

                {user?.username === discussion.user.username && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(discussion.id);
                        setEditContent(discussion.content);
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(discussion.id)}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingId === discussion.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(discussion.id)}
                      className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {discussion.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscussionSection;