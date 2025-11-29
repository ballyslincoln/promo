import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Hidden admin access: Press Ctrl+Shift+A (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A to open admin
      if (e.ctrlKey && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        setShowAdmin(true);
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
