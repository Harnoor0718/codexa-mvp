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
    console.log('🟢 GoogleCallback page loaded');
    console.log('🟢 Current URL:', window.location.href);
    
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    console.log('🟢 Token:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('🟢 User string:', userStr ? 'present' : 'null');
    console.log('🟢 Error:', error);

    if (error) {
      console.log('❌ Error in URL parameters');
      addToast('error', 'Google authentication failed');
      navigate('/login');
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        console.log('✅ User parsed:', user);
        
        // Store token and user
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Token and user stored in localStorage');
        
        // Reload to update auth context
        console.log('✅ Redirecting to home page');
        window.location.href = '/';
      } catch (err) {
        console.log('❌ Failed to parse user:', err);
        addToast('error', 'Failed to process authentication');
        navigate('/login');
      }
    } else {
      console.log('❌ Token or user missing in URL');
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