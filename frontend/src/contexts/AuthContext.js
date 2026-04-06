import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format API error messages
  const formatApiError = (detail) => {
    if (detail == null) return 'Something went wrong. Please try again.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e)))
        .filter(Boolean)
        .join(' ');
    }
    if (detail && typeof detail.msg === 'string') return detail.msg;
    return String(detail);
  };

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
      });
      setUser(data.user);
    } catch (err) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (phone) => {
    try {
      setError(null);
      const { data } = await axios.post(
        `${API}/auth/login`,
        { phone },
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err.response?.data?.detail) || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      setError(null);
      const { data } = await axios.post(
        `${API}/auth/verify-otp`,
        { email, otp },
        { withCredentials: true }
      );
      setUser(data.user);
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err.response?.data?.detail) || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const { data } = await axios.post(
        `${API}/auth/register`,
        userData,
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err.response?.data?.detail) || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    sendOTP,
    verifyOTP,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;