import { sql } from '../db';
import type { User } from '../types';

const USER_KEY = 'ballys_user';

const CASINO_ADJECTIVES = [
  'Lucky', 'Golden', 'Royal', 'Wild', 'Super', 'Mega', 'High', 'Winning', 'Jackpot', 'Fortune',
  'Ace', 'King', 'Queen', 'Diamond', 'Platinum', 'Vip', 'Grand', 'Elite', 'Prime', 'Rich'
];

const CASINO_NOUNS = [
  'Player', 'Roller', 'Spinner', 'Winner', 'Chip', 'Card', 'Dice', 'Slots', 'Wheel', 'Bet',
  'Hand', 'Table', 'Dealer', 'Token', 'Coin', 'Star', 'Guest', 'Member', 'Shark', 'Whale'
];

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const generateUsername = () => {
  const adj = CASINO_ADJECTIVES[Math.floor(Math.random() * CASINO_ADJECTIVES.length)];
  const noun = CASINO_NOUNS[Math.floor(Math.random() * CASINO_NOUNS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
};

export const userService = {
  async getOrCreateUser(): Promise<User> {
    // 1. Check Local Storage first
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      const user = JSON.parse(savedUser);
      // Verify if this user exists in DB if DB is connected, but prioritize returning fast
      // We can do a background sync if needed, but for now just return local
      return user;
    }

    // 2. Fetch IP
    let ip = 'unknown';
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ip = data.ip;
    } catch (e) {
      console.warn('Failed to fetch IP', e);
    }

    // 3. Check DB for existing user by IP (if we have IP)
    if (sql && ip !== 'unknown') {
      try {
        const existing = await sql`SELECT * FROM users WHERE ip_address = ${ip} LIMIT 1`;
        if (existing && existing.length > 0) {
          const user = existing[0] as unknown as User;
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          return user;
        }
      } catch (e) {
        console.error('Failed to check user in DB', e);
      }
    }

    // 4. Create New User
    const newUser: User = {
      id: generateId(),
      ip_address: ip === 'unknown' ? `anon-${generateId()}` : ip,
      username: generateUsername(),
      created_at: new Date().toISOString()
    };

    // 5. Save to DB
    if (sql) {
      try {
        await sql`
          INSERT INTO users (id, ip_address, username, created_at)
          VALUES (${newUser.id}, ${newUser.ip_address}, ${newUser.username}, ${newUser.created_at})
        `;
      } catch (e) {
        console.error('Failed to save user to DB', e);
        // If duplicate IP error happens here (race condition), we should try to fetch again?
        // For simplicity, if it fails, we still return the generated one and rely on local storage
        // but next time they load, they might match the IP in DB.
      }
    }

    // 6. Save to Local Storage
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    
    return newUser;
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  }
};
