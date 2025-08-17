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
import Equality from './pages/Equality/Equality';
import Schemes from './pages/Schemes/Schemes';
import Profile from './pages/Profile/Profile';

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
    if (isAuthenticated && token) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated, token]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
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
        <Route path="emergency" element={<Emergency />} />
        <Route path="equality" element={<Equality />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
