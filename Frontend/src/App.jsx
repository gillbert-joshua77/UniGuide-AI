import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { ThemeProvider } from './Context/ThemeContext';
import './assets/Style/theme.css';
import './components/ui/Button.css';
import './components/ui/Card.css';
import './components/ui/Badge.css';
import './components/ui/Input.css';
import './components/ui/Avatar.css';
import './components/ui/Modal.css';
import './components/ui/Tabs.css';
import './components/ui/Progress.css';
import './components/ui/Skeleton.css';
import './components/ui/Tooltip.css';

import Register from './Authentication/Register';
import Login from './Authentication/Login';
import Profile from './Authentication/Profile';
import OtpForm from './Authentication/OtpForm';
import ForgetPassword from './Authentication/ForgetPassword';
import Home from './Main/Home';
import About from './Main/About';
import ResetPassword from './Authentication/ResetPassword';
import UniGuideChat from './Main/UniGuideAIPage';
import Hackathon from './Main/Hackathon';
import Itnews from './Main/Itnews';
import ProtectedRoute from './Authentication/ProtectRoute';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path='/' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/otp/verify' element={<OtpForm />} />
          <Route path='/forgetpassword' element={<ForgetPassword />} />
          <Route path='/about' element={<About />} />
          <Route path='/password-reset-confirm/:uid/:token' element={<ResetPassword />} />

          <Route path='/dashboard' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/home' element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path='/ai' element={<ProtectedRoute><UniGuideChat /></ProtectedRoute>} />
          <Route path='/hackathon' element={<ProtectedRoute><Hackathon /></ProtectedRoute>} />
          <Route path='/itnews' element={<ProtectedRoute><Itnews /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App;
