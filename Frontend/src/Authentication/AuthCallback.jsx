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
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    }
  }, [ ]);

  return <div>Completing login...</div>;
};

export default AuthCallback;