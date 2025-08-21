import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store/index';
import { getProfile } from './store/slices/authSlice';

// Components
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import Posts from './pages/Posts/Posts';
import Chatbot from './pages/Chatbot/Chatbot';
import Emergency from './pages/Emergency/Emergency';
import CompleteEquality from './pages/Equality/CompleteEquality';
import EnhancedEquality from './pages/Equality/EnhancedEquality';
import Equality from './pages/Equality/Equality';
import Schemes from './pages/Schemes/Schemes';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Profile/Settings';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import SkillSwap from './pages/SkillSwap/SkillSwap';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Log the API URL being used for debugging
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('🌐 API URL:', apiUrl);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    
    if (isAuthenticated && token) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, token]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated && token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="posts" element={<Posts />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="complete-equality" element={<CompleteEquality />} />
        <Route path="enhanced-equality" element={<EnhancedEquality />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="equality" element={<Equality />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="skill-swap" element={<SkillSwap />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;