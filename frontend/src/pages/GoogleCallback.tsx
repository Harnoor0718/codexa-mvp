import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToastStore } from '../stores/toastStore';
import Spinner from '../components/Spinner';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      addToast('error', 'Google authentication failed');
      navigate('/login');
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Store token and user
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Reload to update auth context
        window.location.href = '/';
      } catch (err) {
        addToast('error', 'Failed to process authentication');
        navigate('/login');
      }
    } else {
      addToast('error', 'Authentication failed');
      navigate('/login');
    }
  }, [searchParams, navigate, addToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Spinner size="large" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;