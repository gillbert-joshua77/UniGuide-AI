import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import ProtectedRoute from './Authentication/ProtectRoute';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ToastContainer />
          <Routes>
            <Route path='/' element={<Register />} />
            <Route path='/login' element={<Login />} />
            <Route path='/otp/verify' element={<OtpForm />} />
            <Route path='/forgetpassword' element={<ForgetPassword />} />
            <Route path='/about' element={<About />} />
            <Route path='/password-reset-confirm/:uid/:token' element={<ResetPassword />} />
            <Route path='/auth/callback' element={<AuthCallback />} />

            <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path='/settings' element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path='/guidance' element={<ProtectedRoute><UniGuideChat /></ProtectedRoute>} />
            <Route path='/opportunities' element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
            <Route path='/hackathon' element={<ProtectedRoute><Hackathon /></ProtectedRoute>} />
            <Route path='/news' element={<ProtectedRoute><Itnews /></ProtectedRoute>} />
            <Route path='/my-journey' element={<ProtectedRoute><MyJourney /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
