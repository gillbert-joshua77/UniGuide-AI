import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../Context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

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
      toast.success('Logged in successfully!');
      login({ access_token: access, refresh_token: refresh }).catch(() => {});
      navigate('/');
    }
  }, [navigate, searchParams, login]);

  return <div>Completing login...</div>;
};

export default AuthCallback;