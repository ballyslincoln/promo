import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if auth exists and is valid
    const auth = localStorage.getItem('ballys_auth');
    const authTime = localStorage.getItem('ballys_auth_time');
    
    if (auth === 'true' && authTime) {
        // Check if session is older than 24 hours (in milliseconds)
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        if (now - parseInt(authTime) < ONE_DAY) {
            return true;
        }
    }
    return false;
  });
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
        localStorage.setItem('ballys_auth', 'true');
        // Only set time if it doesn't exist to refresh session only on new login
        if (!localStorage.getItem('ballys_auth_time')) {
            localStorage.setItem('ballys_auth_time', new Date().getTime().toString());
        }
    } else {
        localStorage.removeItem('ballys_auth');
        localStorage.removeItem('ballys_auth_time');
    }
  }, [isAuthenticated]);

  // Hidden admin access: Press Ctrl+Shift+A (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A to open admin
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdmin(true);
      }
      // Escape to logout
      if (e.key === 'Escape') {
          e.preventDefault();
          setIsAuthenticated(false);
          setShowAdmin(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthenticated]);

  if (showAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={() => {
            setIsAuthenticated(true);
            localStorage.setItem('ballys_auth_time', new Date().getTime().toString());
        }}
        onAdminLogin={() => {
            setShowAdmin(true);
            // If logging in via admin shortcut, also authenticate
            setIsAuthenticated(true);
            localStorage.setItem('ballys_auth_time', new Date().getTime().toString());
        }}
      />
    );
  }

  return <Dashboard onAdminOpen={() => setShowAdmin(true)} />;
}

export default App;
