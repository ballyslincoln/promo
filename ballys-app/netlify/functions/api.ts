import { neon } from '@neondatabase/serverless';

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

export default async (req, context) => {
  // Use DATABASE_URL from environment
  const sql = neon(process.env.DATABASE_URL);

  // Get IP from Netlify headers
  const ip = req.headers['x-nf-client-connection-ip'] || req.headers['client-ip'] || 'unknown';

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. Get or Create User based on IP
    let user;
    // Only try to find/create user if we have a valid IP (not unknown, though locally it might be unknown)
    if (ip !== 'unknown') {
        const existingUsers = await sql`SELECT * FROM users WHERE ip_address = ${ip} LIMIT 1`;
        if (existingUsers && existingUsers.length > 0) {
            user = existingUsers[0];
        } else {
            // Create new user
            const newUser = {
                id: generateId(),
                ip_address: ip,
                username: generateUsername(),
                created_at: new Date().toISOString()
            };
            
            try {
                await sql`
                    INSERT INTO users (id, ip_address, username, created_at)
                    VALUES (${newUser.id}, ${newUser.ip_address}, ${newUser.username}, ${newUser.created_at})
                `;
                user = newUser;
            } catch (e) {
                // Handle race condition where user might have been created in parallel
                const retry = await sql`SELECT * FROM users WHERE ip_address = ${ip} LIMIT 1`;
                if (retry && retry.length > 0) {
                    user = retry[0];
                } else {
                    throw e;
                }
            }
        }
    } else {
        // Fallback for local dev without Netlify CLI or if headers missing
        // We can't reliably track spam without IP, but we can return a mock user or require auth
        // For this app, we'll generate a temporary one but not save it to DB to avoid polluting with 'unknown'
        user = { id: 'anon-' + generateId(), username: 'Guest', ip_address: 'unknown' };
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/api/', ''); // simplistic path handling

    // GET /api/interactions?eventId=xyz
    if (req.method === 'GET') {
        const eventId = url.searchParams.get('eventId');
        
        if (eventId) {
            const auraResult = await sql`
                SELECT COUNT(*) as count FROM interactions 
                WHERE event_id = ${eventId} AND type = 'aura'
            `;
            const auraCount = parseInt(auraResult[0].count);

            let hasUserAura = false;
            if (user.id && !user.id.startsWith('anon-')) {
                const userAura = await sql`
                    SELECT id FROM interactions 
                    WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'aura'
                `;
                hasUserAura = userAura.length > 0;
            }

            const commentsResult = await sql`
                SELECT i.*, u.username 
                FROM interactions i
                JOIN users u ON i.user_id = u.id
                WHERE i.event_id = ${eventId} AND i.type = 'comment'
                ORDER BY i.created_at DESC
            `;
            
            const comments = commentsResult.map(r => ({
                id: r.id,
                event_id: r.event_id,
                user_id: r.user_id,
                type: r.type,
                content: r.content,
                created_at: r.created_at,
                username: r.username
            }));

            return new Response(JSON.stringify({ 
                auraCount, 
                hasUserAura, 
                comments,
                currentUser: user 
            }), { status: 200, headers });
        }
        
        // GET /api/user (just return current user info)
        if (url.searchParams.get('action') === 'me') {
             return new Response(JSON.stringify(user), { status: 200, headers });
        }
    }

    // POST /api/interactions
    if (req.method === 'POST') {
        if (user.id.startsWith('anon-')) {
             return new Response(JSON.stringify({ error: 'Cannot interact without valid IP identity' }), { status: 403, headers });
        }

        const body = await req.json();
        const { eventId, type, content } = body;

        if (!eventId || !type) {
            return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
        }

        if (type === 'aura') {
            // Check duplicate
            const existing = await sql`
                SELECT id FROM interactions 
                WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'aura'
            `;
            
            if (existing && existing.length > 0) {
                return new Response(JSON.stringify({ success: false, message: 'Already added aura' }), { status: 200, headers });
            }

            const id = generateId();
            await sql`
                INSERT INTO interactions (id, event_id, user_id, type, created_at)
                VALUES (${id}, ${eventId}, ${user.id}, 'aura', ${new Date().toISOString()})
            `;
            
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        if (type === 'comment') {
            if (!content) {
                 return new Response(JSON.stringify({ error: 'Content required' }), { status: 400, headers });
            }

            // Basic Rate Limit: Check last comment time
            const lastComment = await sql`
                SELECT created_at FROM interactions
                WHERE user_id = ${user.id} AND type = 'comment'
                ORDER BY created_at DESC
                LIMIT 1
            `;

            if (lastComment.length > 0) {
                const lastTime = new Date(lastComment[0].created_at).getTime();
                const now = new Date().getTime();
                if (now - lastTime < 5000) { // 5 seconds cooldown
                     return new Response(JSON.stringify({ error: 'Please wait before commenting again' }), { status: 429, headers });
                }
            }

            const id = generateId();
            const timestamp = new Date().toISOString();
            
            await sql`
                INSERT INTO interactions (id, event_id, user_id, type, content, created_at)
                VALUES (${id}, ${eventId}, ${user.id}, 'comment', ${content}, ${timestamp})
            `;

            return new Response(JSON.stringify({ 
                success: true, 
                interaction: {
                    id,
                    event_id: eventId,
                    user_id: user.id,
                    type: 'comment',
                    content,
                    created_at: timestamp,
                    username: user.username
                }
            }), { status: 200, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500, headers });
  }
};
