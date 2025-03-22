import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';

function ProtectedRoute({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('user');
        
        if (!user) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Check if registration is complete
        const response = await api.get('/api/auth/check-registration');
        setRegistrationComplete(response.data.registrationComplete);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!registrationComplete) {
    return <Navigate to="/resume-upload" />;
  }

  return children;
}

export default ProtectedRoute; 