import React, { Suspense, lazy } from 'react';
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

import Home from './Main/Home';
import About from './Main/About';
import RequireAuth from './Authentication/RequireAuth';
import AuthModal from './Components/AuthModal';
import Maintenance from './Main/Maintenance';
import { isMaintenanceModeEnabled } from './lib/maintenance';

const Register = lazy(() => import('./Authentication/Register'));
const Login = lazy(() => import('./Authentication/Login'));
const Profile = lazy(() => import('./Authentication/Profile'));
const Settings = lazy(() => import('./Authentication/Settings'));
const OtpForm = lazy(() => import('./Authentication/OtpForm'));
const ForgetPassword = lazy(() => import('./Authentication/ForgetPassword'));
const ResetPassword = lazy(() => import('./Authentication/ResetPassword'));
const AuthCallback = lazy(() => import('./Authentication/AuthCallback'));
const UniGuideChat = lazy(() => import('./Main/UniGuideAIPage'));
const Opportunities = lazy(() => import('./Main/Opportunities'));
const Hackathon = lazy(() => import('./Main/Hackathon'));
const Itnews = lazy(() => import('./Main/Itnews'));
const MyJourney = lazy(() => import('./Main/MyJourney'));

const App = () => {
  // Global kill-switch: when enabled, every route (known, protected, or
  // unknown) renders the maintenance page and no normal UI mounts.
  if (isMaintenanceModeEnabled()) {
    return <Maintenance />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ToastContainer />
          <AuthModal />
          <Suspense fallback={<div className="app-route-fallback" style={{ minHeight: '100vh' }} />}>
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
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;