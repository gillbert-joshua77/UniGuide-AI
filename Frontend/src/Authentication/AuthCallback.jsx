import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Login failed: ' + error);
      navigate('/register');
      return;
    }

    if (access && refresh) {
      // Save tokens — now user is logged in
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    }
  }, [navigate, searchParams]);

  return <div>Completing login...</div>;
};

export default AuthCallback;