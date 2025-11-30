import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('ballys_auth') === 'true';
  });
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
        localStorage.setItem('ballys_auth', 'true');
    } else {
        localStorage.removeItem('ballys_auth');
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
        onLogin={() => setIsAuthenticated(true)}
        onAdminLogin={() => setShowAdmin(true)}
      />
    );
  }

  return <Dashboard onAdminOpen={() => setShowAdmin(true)} />;
}

export default App;
