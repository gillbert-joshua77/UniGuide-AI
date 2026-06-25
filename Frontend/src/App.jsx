import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

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

const App = () => {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* 🔓 Public Routes */}
        <Route path='/' element={<Register />} />
        <Route path='/login' element={<Login />} />
        <Route path='/otp/verify' element={<OtpForm />} />
        <Route path='/forgetpassword' element={<ForgetPassword />} />
        <Route path='/dashboard' element={<Profile />} />
        <Route path='/home' element={<Home />} />
        <Route path='/about' element = {<About/>} />
        <Route path='/password-reset-confirm/:uid/:token' element ={<ResetPassword/>} />
        <Route path='ai' element = {<UniGuideChat/>} />
        <Route path='hackathon' element = {<Hackathon/>} />
        <Route path='itnews' element = {<Itnews/>} />
      </Routes>
    </Router>
  )
}

export default App;