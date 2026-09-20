import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { ThemeProvider } from './Context/ThemeContext';
import { AuthProvider } from './Context/AuthContext';
import './assets/Style/theme.css';
import './Components/ui/Button.css';
import './Components/ui/Card.css';
import './Components/ui/Badge.css';
import './Components/ui/Input.css';
import './Components/ui/Avatar.css';
import './Components/ui/Modal.css';
import './Components/ui/Tabs.css';
import './Components/ui/Progress.css';
import './Components/ui/Skeleton.css';
import './Components/ui/Tooltip.css';

import Register from './Authentication/Register';
import Login from './Authentication/Login';
import Profile from './Authentication/Profile';
import Settings from './Authentication/Settings';
import OtpForm from './Authentication/OtpForm';
import ForgetPassword from './Authentication/ForgetPassword';
import ResetPassword from './Authentication/ResetPassword';
import AuthCallback from './Authentication/AuthCallback';
import Home from './Main/Home';
import About from './Main/About';
import UniGuideChat from './Main/UniGuideAIPage';
import Opportunities from './Main/Opportunities';
import Hackathon from './Main/Hackathon';
import Itnews from './Main/Itnews';
import MyJourney from './Main/MyJourney';
import RequireAuth from './Authentication/RequireAuth';
import AuthModal from './Components/AuthModal';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ToastContainer />
          <AuthModal />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/home' element={<Navigate to="/" replace />} />
            <Route path='/register' element={<Register />} />
            <Route path='/login' element={<Login />} />
            <Route path='/otp/verify' element={<OtpForm />} />
            <Route path='/forgetpassword' element={<ForgetPassword />} />
            <Route path='/about' element={<About />} />
            <Route path='/password-reset-confirm/:uid/:token' element={<ResetPassword />} />
            <Route path='/auth/callback' element={<AuthCallback />} />

            <Route path='/profile' element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path='/settings' element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path='/guidance' element={<RequireAuth><UniGuideChat /></RequireAuth>} />
            <Route path='/opportunities' element={<RequireAuth><Opportunities /></RequireAuth>} />
            <Route path='/hackathon' element={<RequireAuth><Hackathon /></RequireAuth>} />
            <Route path='/news' element={<RequireAuth><Itnews /></RequireAuth>} />
            <Route path='/my-journey' element={<RequireAuth><MyJourney /></RequireAuth>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;