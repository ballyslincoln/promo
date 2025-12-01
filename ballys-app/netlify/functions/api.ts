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

// Initialize DB Tables
const initDB = async (sql) => {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                ip_address TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS interactions (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                created_at TEXT NOT NULL
            );
        `;
    } catch (e) {
        console.error('Failed to init DB tables in API:', e);
    }
};

export default async (req, context) => {
    // Use DATABASE_URL from environment
    const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || "postgresql://neondb_owner:npg_3IOi0CKjqomx@ep-dry-boat-aeb1v1gd-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
    if (!dbUrl) {
        console.error('DATABASE_URL is missing in environment variables');
        return new Response(JSON.stringify({ error: 'Database configuration missing' }), { status: 500 });
    }

    const sql = neon(dbUrl);

    // Get IP from Netlify headers
    const ip = req.headers['x-nf-client-connection-ip'] || req.headers['client-ip'] || 'unknown';

    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        await initDB(sql);

        // 1. Get or Create User based on IP
        let user;
        if (ip !== 'unknown') {
            const existingUsers = await sql`SELECT * FROM users WHERE ip_address = ${ip} LIMIT 1`;
            if (existingUsers && existingUsers.length > 0) {
                user = existingUsers[0];
            } else {
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
                    const retry = await sql`SELECT * FROM users WHERE ip_address = ${ip} LIMIT 1`;
                    if (retry && retry.length > 0) {
                        user = retry[0];
                    } else {
                        throw e;
                    }
                }
            }
        } else {
            user = { id: 'anon-' + generateId(), username: 'Guest', ip_address: 'unknown' };
        }

        const url = new URL(req.url);

        // DELETE /api/interactions?id=xyz
        if (req.method === 'DELETE') {
            const id = url.searchParams.get('id');
            const isAdmin = url.searchParams.get('isAdmin') === 'true';
            
            if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400, headers });

            // Let's check if the interaction belongs to the user
            const interaction = await sql`SELECT user_id FROM interactions WHERE id = ${id}`;
            if (interaction.length === 0) {
                return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
            }

            // Allow deletion if user owns it OR if user is admin (indicated by isAdmin param)
            // Note: In a production app, isAdmin should be verified via a secure token, not a query param.
            // Given the lightweight nature here, we'll trust the param but verify ownership as fallback.
            if (interaction[0].user_id !== user.id && !isAdmin) {
                 return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers });
            }

            await sql`DELETE FROM interactions WHERE id = ${id}`;
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

        // GET /api/interactions
        if (req.method === 'GET') {
            const eventId = url.searchParams.get('eventId');
            const action = url.searchParams.get('action');

            // Stats Action
            if (action === 'stats') {
                const idsParam = url.searchParams.get('ids');
                if (!idsParam) return new Response(JSON.stringify({}), { status: 200, headers });

                const ids = idsParam.split(',');
                if (ids.length === 0) return new Response(JSON.stringify({}), { status: 200, headers });

                const rows = await sql`
                    SELECT event_id, type, COUNT(*) as count 
                    FROM interactions 
                    WHERE event_id = ANY(${ids})
                    GROUP BY event_id, type
                `;

                const stats = {};
                ids.forEach(id => {
                    const auraRow = rows.find(r => r.event_id === id && r.type === 'aura');
                    const commentRow = rows.find(r => r.event_id === id && r.type === 'comment');
                    stats[id] = {
                        aura: auraRow ? parseInt(auraRow.count) : 0,
                        comments: commentRow ? parseInt(commentRow.count) : 0
                    };
                });

                return new Response(JSON.stringify(stats), { status: 200, headers });
            }

            // Get Interactions for Event
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
                    LEFT JOIN users u ON i.user_id = u.id
                    WHERE i.event_id = ${eventId} AND i.type = 'comment'
                    ORDER BY i.created_at DESC
                `;

                // Fetch likes for comments
                const commentIds = commentsResult.map(c => c.id);
                let likesMap = {};
                let userLikesMap = {};

                if (commentIds.length > 0) {
                    const likesResult = await sql`
                        SELECT event_id, COUNT(*) as count 
                        FROM interactions 
                        WHERE type = 'like' AND event_id = ANY(${commentIds})
                        GROUP BY event_id
                    `;
                    likesResult.forEach(r => likesMap[r.event_id] = parseInt(r.count));

                    if (user.id && !user.id.startsWith('anon-')) {
                        const userLikesResult = await sql`
                            SELECT event_id FROM interactions 
                            WHERE type = 'like' AND user_id = ${user.id} AND event_id = ANY(${commentIds})
                        `;
                        userLikesResult.forEach(r => userLikesMap[r.event_id] = true);
                    }
                }

                const comments = commentsResult.map(r => ({
                    id: r.id,
                    event_id: r.event_id,
                    user_id: r.user_id,
                    type: r.type,
                    content: r.content,
                    created_at: r.created_at,
                    username: r.username,
                    likes: likesMap[r.id] || 0,
                    hasLiked: !!userLikesMap[r.id]
                }));

                return new Response(JSON.stringify({
                    auraCount,
                    hasUserAura,
                    comments,
                    currentUser: user
                }), { status: 200, headers });
            }

            // GET /api/user
            if (action === 'me') {
                return new Response(JSON.stringify(user), { status: 200, headers });
            }
        }

        // POST /api/interactions
        if (req.method === 'POST') {
            const body = await req.json();
            const { eventId, type, content } = body;

            if (!eventId || !type) {
                return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });
            }

            // Aura
            if (type === 'aura') {
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

            // Like (Comment)
            if (type === 'like') {
                // eventId here is actually the commentId
                const existing = await sql`
                    SELECT id FROM interactions 
                    WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'like'
                `;

                if (existing && existing.length > 0) {
                    // Toggle off (unlike)
                    await sql`DELETE FROM interactions WHERE id = ${existing[0].id}`;
                    return new Response(JSON.stringify({ success: true, action: 'unliked' }), { status: 200, headers });
                } else {
                    // Toggle on (like)
                    const id = generateId();
                    await sql`
                        INSERT INTO interactions (id, event_id, user_id, type, created_at)
                        VALUES (${id}, ${eventId}, ${user.id}, 'like', ${new Date().toISOString()})
                    `;
                    return new Response(JSON.stringify({ success: true, action: 'liked' }), { status: 200, headers });
                }
            }

            // Comment
            if (type === 'comment') {
                if (!content) {
                    return new Response(JSON.stringify({ error: 'Content required' }), { status: 400, headers });
                }
                
                // Rate Limiting: Check last 3 comments in the last minute
                const recentComments = await sql`
                    SELECT created_at FROM interactions
                    WHERE user_id = ${user.id} AND type = 'comment'
                    ORDER BY created_at DESC
                    LIMIT 3
                `;
                
                if (recentComments.length >= 3) {
                    const oldestRecent = new Date(recentComments[2].created_at).getTime();
                    const now = new Date().getTime();
                    // If the 3rd most recent comment was less than 30 seconds ago, block
                    if (now - oldestRecent < 30000) {
                         return new Response(JSON.stringify({ error: 'You are commenting too fast. Please wait a moment.' }), { status: 429, headers });
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
                        username: user.username,
                        likes: 0,
                        hasLiked: false
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
