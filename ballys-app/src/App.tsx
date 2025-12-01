import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';
import AnnouncementBanner from './components/AnnouncementBanner';
import { getActiveAnnouncement, initAnnouncementTable } from './services/announcementService';
import { eventService } from './services/eventService';
import { userService } from './services/userService';
import type { Announcement } from './types';

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
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  // Initialize user session immediately
  useEffect(() => {
    userService.getOrCreateUser();
  }, []);

  const fetchAnnouncement = async () => {
    const active = await getActiveAnnouncement();
    setAnnouncement(active);
  };

  useEffect(() => {
    const initAndFetch = async () => {
      await initAnnouncementTable();
      await eventService.initDatabase();
      await fetchAnnouncement();
    };
    initAndFetch();
  }, []);

  // Refetch announcement when admin panel is closed to update any changes
  useEffect(() => {
    if (!showAdmin) {
      fetchAnnouncement();
    }
  }, [showAdmin]);

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
      // Ctrl+Shift+A or Cmd+Shift+A (Mac) to open admin
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
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

  const handleDismissAnnouncement = () => {
    setAnnouncement(null);
  };

  const renderContent = () => {
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
  };

  return (
    <>
      {announcement && (
        <AnnouncementBanner
          announcement={announcement}
          onDismiss={handleDismissAnnouncement}
        />
      )}
      {renderContent()}
    </>
  );
}

export default App;
