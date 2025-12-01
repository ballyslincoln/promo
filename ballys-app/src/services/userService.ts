import type { User } from '../types';

const USER_KEY = 'ballys_user';

export const userService = {
  async getOrCreateUser(): Promise<User | null> {
    try {
      // Fetch current user from API (which identifies by IP)
      const res = await fetch('/api/interactions?action=me');
      if (res.ok) {
        const user = await res.json();
        // Cache locally for UI only, but API is authority
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }
    } catch (e) {
      console.warn('Failed to fetch user from API', e);
    }

    // Fallback to local storage if API is down, but this user won't be able to interact securely
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  }
};
