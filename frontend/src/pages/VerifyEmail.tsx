import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToastStore } from '../stores/toastStore';
import Spinner from '../components/Spinner';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await authAPI.verifyEmail(token!);
      setSuccess(true);
      addToast('success', 'Email verified successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to verify email';
      setError(errorMsg);
      addToast('error', errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {verifying ? (
          <>
            <Spinner size="large" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verifying your email...
            </h2>
          </>
        ) : success ? (
          <>
            <div className="text-6xl">✓</div>
            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">
              Email Verified!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your email has been verified successfully. Redirecting to dashboard...
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl">✗</div>
            <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">
              Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Link
              to="/dashboard"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;