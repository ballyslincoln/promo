import type { User } from '../types';

const USER_KEY = 'ballys_user';

export const userService = {
  async getOrCreateUser(): Promise<User | null> {
    try {
      // Fetch current user from API (which identifies by IP)
      const res = await fetch('/api/interactions?action=me');
      if (res.ok) {
        const user = await res.json();
        // Cache locally for UI only
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }
      console.error('Failed to get user from API');
    } catch (e) {
      console.error('Error getting user:', e);
    }

    // Fallback to cached user if API fails, or null
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  }
};
