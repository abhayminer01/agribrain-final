import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Users from './pages/Users';
import Fields from './pages/Fields';
import Queries from './pages/Queries';
import Announcements from './pages/Announcements';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (Admin check)
    // We can assume if they have the cookie, auth might be valid, but we should verify.
    // For now, we'll let Layout handle the strict `/auth/me` check, or do a quick check here.
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:5000/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.user.role === 'Admin') {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check failed');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-admin-dark text-admin-accent"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-admin-accent"></div></div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login setAuth={setIsAuthenticated} />} />
        
        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <Layout setAuth={setIsAuthenticated} /> : <Navigate to="/login" />}>
          <Route index element={<Users />} />
          <Route path="fields" element={<Fields />} />
          <Route path="queries" element={<Queries />} />
          <Route path="announcements" element={<Announcements />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
