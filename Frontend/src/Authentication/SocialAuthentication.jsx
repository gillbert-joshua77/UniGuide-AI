import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../Utils/axiosInstance';
import { useAuth } from '../Context/useAuth';

const GoogleOAuthButton = ({ redirectPath = '/' }) => {
  const navigate = useNavigate();
  const btnContainerRef = useRef(null);
  const { login } = useAuth();

  const handleSignWithGoogle = useCallback(async (response) => {
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
        await login({
          access_token: res.data.access_token,
          refresh_token: res.data.refresh_token,
        }).catch(() => {});
        setTimeout(() => {
          navigate(redirectPath || '/');
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
  }, [login, navigate, redirectPath]);

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
  }, [handleSignWithGoogle]);

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", minHeight: "44px" }}>
      <div ref={btnContainerRef}></div>
    </div>
  );
};

export default GoogleOAuthButton;