import React from 'react';

interface Submission {
  id: number;
  code: string;
  language: string;
  status: string;
  runtime: number | null;
  memory: number | null;
  submittedAt: string;
}

interface SubmissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: Submission[];
  onSelectSubmission: (code: string, language: string) => void;
}

const SubmissionHistoryModal: React.FC<SubmissionHistoryModalProps> = ({
  isOpen,
  onClose,
  submissions,
  onSelectSubmission
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AC': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
      case 'WA': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
      case 'TLE': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
      case 'CE': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30';
      case 'RE': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AC': return 'Accepted';
      case 'WA': return 'Wrong Answer';
      case 'TLE': return 'Time Limit Exceeded';
      case 'CE': return 'Compilation Error';
      case 'RE': return 'Runtime Error';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submission History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No previous submissions found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    onSelectSubmission(submission.code, submission.language);
                    onClose();
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(submission.status)}`}>
                        {getStatusText(submission.status)}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {submission.language}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(submission.submittedAt)}
                    </span>
                  </div>
                  {submission.runtime !== null && (
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Runtime: {submission.runtime}ms</span>
                      {submission.memory !== null && <span>Memory: {submission.memory}KB</span>}
                    </div>
                  )}
                  <div className="mt-2 bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs font-mono text-gray-800 dark:text-gray-300 max-h-20 overflow-hidden">
                    {submission.code.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionHistoryModal;