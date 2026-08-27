import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../Utils/axiosInstance';
import { useAuth } from '../Context/AuthContext';

const GoogleOAuthButton = () => {
  const navigate = useNavigate();
  const btnContainerRef = useRef(null);
  const { loadProfile } = useAuth();

  const handleSignWithGoogle = async (response) => {
    try {
      const payload = response.credential;
      if (!payload) {
        toast.error("Google did not return a credential. Please try again.");
        return;
      }

      const res = await axiosInstance.post('auth/google/', {
        access_token: payload,
      });

      if (res.status === 200) {
        toast.success("Google Authentication Successful 🎉");
        localStorage.setItem("accessToken", res.data.access_token);
        localStorage.setItem("refreshToken", res.data.refresh_token);
        localStorage.setItem('uniguide_user_name', res.data.full_name || '');
        localStorage.setItem('uniguide_user_email', res.data.email || '');
        await loadProfile().catch(() => {});
        const isNewSignup = res.data.is_new === true;
        setTimeout(() => {
          navigate(isNewSignup ? "/home?setup=1" : "/home");
        }, 800);
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      if (err?.code === 'ERR_NETWORK') {
        toast.error("Cannot connect to backend. Please try again later.");
        return;
      }
      const msg = err.response?.data?.detail || err.response?.data?.access_token || "Google authentication failed";
      toast.error(typeof msg === 'string' ? msg : "Google Authentication Failed");
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not set in environment");
      return;
    }

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleSignWithGoogle,
        });

        if (btnContainerRef.current) {
          btnContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(
            btnContainerRef.current,
            { theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: "320" }
          );
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogle();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", minHeight: "44px" }}>
      <div ref={btnContainerRef}></div>
    </div>
  );
};

export default GoogleOAuthButton;