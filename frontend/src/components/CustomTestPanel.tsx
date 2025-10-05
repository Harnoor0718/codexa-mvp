import React, { useState } from 'react';
import { submissionAPI } from '../services/api';
import { useToastStore } from '../stores/toastStore';
import Spinner from './Spinner';

interface CustomTestPanelProps {
  code: string;
  language: string;
}

const CustomTestPanel: React.FC<CustomTestPanelProps> = ({ code, language }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const addToast = useToastStore((state) => state.addToast);

  const handleTest = async () => {
    if (!code.trim()) {
      addToast('warning', 'Please write some code first');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setOutput('');
    setError('');

    try {
      const response = await submissionAPI.testCustomInput({
        code,
        language,
        input
      });

      const result = response.data.result;
      setTestResult(result);

      if (result.status === 'AC' || result.stdout) {
        setOutput(result.stdout);
        addToast('success', 'Code executed successfully');
      } else if (result.compile_output) {
        setError(result.compile_output);
        addToast('error', 'Compilation error');
      } else if (result.stderr) {
        setError(result.stderr);
        addToast('error', 'Runtime error');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Test execution failed';
      setError(errorMsg);
      addToast('error', errorMsg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Custom Test</h3>
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing && <Spinner size="small" color="border-white" />}
            {testing ? 'Running...' : 'Run Code'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Input Section */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your test input here..."
              className="w-full h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono resize-none"
            />
          </div>

          {/* Output Section */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Output
            </label>
            <div className="w-full h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono overflow-auto whitespace-pre-wrap">
              {error ? (
                <span className="text-red-600 dark:text-red-400">{error}</span>
              ) : output ? (
                <span className="text-green-600 dark:text-green-400">{output}</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-600">Output will appear here...</span>
              )}
            </div>
          </div>
        </div>

        {/* Test Result Stats */}
        {testResult && (
          <div className="mt-3 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span>Status: <span className="font-semibold">{testResult.statusDescription}</span></span>
            {testResult.runtime !== null && (
              <span>Runtime: <span className="font-semibold">{testResult.runtime}ms</span></span>
            )}
            {testResult.memory !== null && (
              <span>Memory: <span className="font-semibold">{testResult.memory}KB</span></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomTestPanel;