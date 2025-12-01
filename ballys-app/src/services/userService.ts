import { sql } from '../db';
import type { User } from '../types';
import { generateId, generateUsername } from '../utils';

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
      throw new Error('API failed');
    } catch (e) {
      console.warn('API unavailable, falling back to direct DB/local', e);

      // Fallback to local storage if API is down
      const saved = localStorage.getItem(USER_KEY);
      if (saved) {
        // Verify if the saved user is valid (optional, but good practice)
        return JSON.parse(saved);
      }

      let ip = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          ip = ipData.ip;
        }
      } catch (ipError) {
        console.warn('Failed to get public IP', ipError);
      }

      // If we have a real IP and DB connection, check for existing user
      if (ip !== 'unknown' && sql) {
        try {
          const existing = await sql`SELECT * FROM users WHERE ip_address = ${ip} LIMIT 1`;
          if (existing && existing.length > 0) {
            const user = existing[0] as User;
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            return user;
          }
        } catch (dbCheckError) {
          console.error('Failed to check existing user by IP', dbCheckError);
        }
      }

      // If no existing user found or IP fetch failed, create new
      const newUser: User = {
        id: generateId(),
        ip_address: ip !== 'unknown' ? ip : `local-${generateId()}`,
        username: generateUsername(),
        created_at: new Date().toISOString()
      };

      if (sql) {
        try {
          await sql`
                  INSERT INTO users (id, ip_address, username, created_at)
                  VALUES (${newUser.id}, ${newUser.ip_address}, ${newUser.username}, ${newUser.created_at})
              `;
        } catch (dbError) {
          console.error('Failed to create local user in DB', dbError);
          // If insertion fails (e.g. race condition on unique IP), try to fetch again
          if (ip !== 'unknown') {
            try {
              const retry = await sql`SELECT * FROM users WHERE ip_address = ${ip} LIMIT 1`;
              if (retry && retry.length > 0) {
                const user = retry[0] as User;
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                return user;
              }
            } catch (retryError) { console.error('Retry fetch failed', retryError); }
          }
        }
      }

      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return newUser;
    }
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  }
};
