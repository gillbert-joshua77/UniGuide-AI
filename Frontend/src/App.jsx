import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { ThemeProvider } from './Context/ThemeContext';
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
