import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../Context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loadProfile } = useAuth();

  useEffect(() => {
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Login failed: ' + error);
      navigate('/');
      return;
    }

    if (access && refresh) {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      toast.success('Logged in successfully!');
      loadProfile().catch(() => {});
      navigate('/home');
    }
  }, [navigate, searchParams, loadProfile]);

  return <div>Completing login...</div>;
};

export default AuthCallback;