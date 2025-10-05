import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { problemAPI, submissionAPI } from '../services/api';
import { useToastStore } from '../stores/toastStore';
import Spinner from '../components/Spinner';
import CustomTestPanel from '../components/CustomTestPanel';
import SubmissionHistoryModal from '../components/SubmissionHistoryModal';
import type { Problem } from '../types';
import DiscussionSection from '../components/DiscussionSection';

const ProblemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showCustomTest, setShowCustomTest] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchProblem();
  }, [id]);

  const fetchProblem = async () => {
    try {
      const response = await problemAPI.getById(Number(id));
      setProblem(response.data.problem);
      setCode(getDefaultCode(language));
    } catch (error) {
      console.error('Error fetching problem:', error);
      addToast('error', 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionHistory = async () => {
    if (!problem) return;
    
    setLoadingHistory(true);
    try {
      const response = await submissionAPI.getProblemSubmissions(problem.id);
      setSubmissions(response.data.submissions);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      addToast('error', 'Failed to load submission history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const getDefaultCode = (lang: string) => {
    const defaults: { [key: string]: string } = {
      python: '# Write your code here\n',
      javascript: '// Write your code here\n',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}',
      java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}',
      c: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}'
    };
    return defaults[lang] || '';
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(getDefaultCode(newLang));
  };

  const handleSelectSubmission = (submissionCode: string, submissionLang: string) => {
    setCode(submissionCode);
    setLanguage(submissionLang);
    addToast('info', 'Previous submission loaded');
  };

  const handleSubmit = async () => {
    if (!problem) return;
    
    setSubmitting(true);
    setResult(null);
    addToast('info', 'Running your code...');

    try {
      const response = await submissionAPI.submit({
        problemId: problem.id,
        code,
        language
      });
      setResult(response.data.submission);
      
      if (response.data.submission.status === 'AC') {
        addToast('success', 'All test cases passed!');
      } else {
        addToast('error', 'Some test cases failed');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Submission failed';
      setResult({ error: errorMsg });
      addToast('error', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
        <Spinner size="large" />
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading problem...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-red-600 dark:text-red-400">Problem not found</div>
      </div>
    );
  }

 return(
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <div className="flex-1 flex overflow-hidden">
      {/* Problem Description */}
      <div className="w-1/2 overflow-y-auto border-r border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{problem.title}</h1>
        <div className="flex gap-2 mb-4">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${
            problem.difficulty === 'EASY' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            problem.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="prose max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{problem.description}</p>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Constraints</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
            <li>Time Limit: {problem.timeLimit}ms</li>
            <li>Memory Limit: {problem.memoryLimit}MB</li>
          </ul>
        </div>

        {/* Discussion Section */}
        <div className="mt-8">
          <DiscussionSection problemId={problem.id} />
        </div>
      </div>

      {/* Code Editor */}
      <div className="w-1/2 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
            
            <button
              onClick={fetchSubmissionHistory}
              disabled={loadingHistory}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              {loadingHistory && <Spinner size="small" />}
              History
            </button>

            <button
              onClick={() => setShowCustomTest(!showCustomTest)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {showCustomTest ? 'Hide Test' : 'Custom Test'}
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Spinner size="small" color="border-white" />}
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <div className={showCustomTest ? 'h-1/2' : 'flex-1'}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </div>

          {/* Custom Test Panel */}
          {showCustomTest && (
            <div className="h-1/2 overflow-auto">
              <CustomTestPanel code={code} language={language} />
            </div>
          )}
        </div>

        {/* Result Panel */}
        {result && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
            {result.error ? (
              <div className="text-red-600 dark:text-red-400 font-semibold">{result.error}</div>
            ) : (
              <div>
                <div className={`text-lg font-bold mb-2 ${
                  result.status === 'AC' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {result.status === 'AC' ? 'Accepted' : 
                   result.status === 'WA' ? 'Wrong Answer' :
                   result.status === 'TLE' ? 'Time Limit Exceeded' :
                   result.status === 'CE' ? 'Compilation Error' : 'Runtime Error'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Passed: {result.passedTestCases}/{result.totalTestCases} test cases</div>
                  <div>Runtime: {result.runtime}ms</div>
                  <div>Memory: {result.memory}KB</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Submission History Modal */}
    <SubmissionHistoryModal
      isOpen={showHistory}
      onClose={() => setShowHistory(false)}
      submissions={submissions}
      onSelectSubmission={handleSelectSubmission}
    />
  </div>
);
};

export default ProblemDetail;