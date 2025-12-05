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
        await sql`
            CREATE TABLE IF NOT EXISTS admins (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                pin TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'admin',
                created_at TEXT NOT NULL,
                last_login TEXT
            );
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                admin_id TEXT,
                admin_name TEXT,
                action_type TEXT NOT NULL,
                description TEXT,
                timestamp TEXT NOT NULL,
                metadata JSONB
            );
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS active_sessions (
                id TEXT PRIMARY KEY,
                last_seen TIMESTAMPTZ DEFAULT NOW()
            );
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS promotion_views (
                promotion_id TEXT PRIMARY KEY,
                count INTEGER DEFAULT 0,
                last_viewed TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        // Seed Master Admin if no admins exist
        const adminCount = await sql`SELECT COUNT(*) as count FROM admins`;
        if (parseInt(adminCount[0].count) === 0) {
            console.log('Seeding Master Admin...');
            const masterId = generateId();
            await sql`
                INSERT INTO admins (id, username, pin, role, created_at)
                VALUES (${masterId}, 'Master Admin', '91091', 'master', ${new Date().toISOString()})
            `;
        }
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

        const url = new URL(req.url);
        const action = url.searchParams.get('action');

        // ---------------------------------------------------------
        // ADMIN AUTH & MANAGEMENT
        // ---------------------------------------------------------

        if (req.method === 'POST' && action === 'admin_login') {
            const body = await req.json();
            const { pin } = body;
            
            const admins = await sql`SELECT * FROM admins WHERE pin = ${pin} LIMIT 1`;
            
            if (admins.length > 0) {
                const admin = admins[0];
                // Update last login
                await sql`UPDATE admins SET last_login = ${new Date().toISOString()} WHERE id = ${admin.id}`;
                
                // Log activity
                await sql`
                    INSERT INTO activity_logs (id, admin_id, admin_name, action_type, description, timestamp)
                    VALUES (${generateId()}, ${admin.id}, ${admin.username}, 'login', 'Admin logged in', ${new Date().toISOString()})
                `;
                
                return new Response(JSON.stringify({ success: true, admin }), { status: 200, headers });
            } else {
                return new Response(JSON.stringify({ success: false, error: 'Invalid PIN' }), { status: 401, headers });
            }
        }

        if (req.method === 'POST' && action === 'admin_manage_users') {
            const body = await req.json();
            const { requestAdminId, method, data } = body;
            
            // Verify requester is Master Admin
            const requester = await sql`SELECT role FROM admins WHERE id = ${requestAdminId}`;
            if (!requester.length || requester[0].role !== 'master') {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers });
            }

            if (method === 'list') {
                const allAdmins = await sql`SELECT id, username, role, created_at, last_login, pin FROM admins ORDER BY created_at DESC`;
                return new Response(JSON.stringify({ admins: allAdmins }), { status: 200, headers });
            }

            if (method === 'create') {
                const { username, pin, role } = data;
                // Check duplicates
                const existing = await sql`SELECT id FROM admins WHERE username = ${username} OR pin = ${pin}`;
                if (existing.length > 0) {
                    return new Response(JSON.stringify({ error: 'Username or PIN already exists' }), { status: 400, headers });
                }
                
                const newId = generateId();
                await sql`
                    INSERT INTO admins (id, username, pin, role, created_at)
                    VALUES (${newId}, ${username}, ${pin}, ${role || 'admin'}, ${new Date().toISOString()})
                `;
                
                // Log it
                await sql`
                    INSERT INTO activity_logs (id, admin_id, admin_name, action_type, description, timestamp, metadata)
                    VALUES (${generateId()}, ${requestAdminId}, 'Master Admin', 'create_user', ${`Created user ${username}`}, ${new Date().toISOString()}, ${JSON.stringify({ created_user: username, role })})
                `;
                
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            }

            if (method === 'update') {
                const { id, username, pin } = data;
                
                // Check if updating master (prevent role change/deletion via this simple API if needed, but update is fine)
                 await sql`
                    UPDATE admins 
                    SET username = ${username}, pin = ${pin}
                    WHERE id = ${id}
                `;
                 
                 // Log it
                await sql`
                    INSERT INTO activity_logs (id, admin_id, admin_name, action_type, description, timestamp, metadata)
                    VALUES (${generateId()}, ${requestAdminId}, 'Master Admin', 'update_user', ${`Updated user ${username}`}, ${new Date().toISOString()}, ${JSON.stringify({ updated_user_id: id })})
                `;
                 return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            }

            if (method === 'delete') {
                const { id } = data;
                // Prevent deleting self or master (though master check handles self if unique)
                if (id === requestAdminId) {
                     return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), { status: 400, headers });
                }
                
                const target = await sql`SELECT role FROM admins WHERE id = ${id}`;
                if (target.length && target[0].role === 'master') {
                     return new Response(JSON.stringify({ error: 'Cannot delete Master Admin' }), { status: 400, headers });
                }

                await sql`DELETE FROM admins WHERE id = ${id}`;
                
                // Log it
                await sql`
                    INSERT INTO activity_logs (id, admin_id, admin_name, action_type, description, timestamp, metadata)
                    VALUES (${generateId()}, ${requestAdminId}, 'Master Admin', 'delete_user', ${`Deleted user with ID ${id}`}, ${new Date().toISOString()}, ${JSON.stringify({ deleted_user_id: id })})
                `;
                
                return new Response(JSON.stringify({ success: true }), { status: 200, headers });
            }
        }
        
        if (req.method === 'GET' && action === 'admin_logs') {
             const requestAdminId = url.searchParams.get('adminId');
             
             // Verify requester is Master Admin
            const requester = await sql`SELECT role FROM admins WHERE id = ${requestAdminId}`;
            if (!requester.length || requester[0].role !== 'master') {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers });
            }
            
            const logs = await sql`SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100`;
            return new Response(JSON.stringify({ logs }), { status: 200, headers });
        }

        // ---------------------------------------------------------
        // STANDARD USER / INTERACTION LOGIC
        // ---------------------------------------------------------

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

        // ---------------------------------------------------------
        // ANALYTICS (Active Users & Promotion Views)
        // ---------------------------------------------------------
        
        if (action === 'heartbeat') {
             // 1. Update or Insert Session
             await sql`
                INSERT INTO active_sessions (id, last_seen)
                VALUES (${user.id}, NOW())
                ON CONFLICT (id) DO UPDATE SET last_seen = NOW()
             `;
             
             // 2. Cleanup Old Sessions (> 60 seconds)
             await sql`
                DELETE FROM active_sessions WHERE last_seen < NOW() - INTERVAL '60 seconds'
             `;
             
             // 3. Get Count
             const countResult = await sql`SELECT COUNT(*) as count FROM active_sessions`;
             return new Response(JSON.stringify({ count: parseInt(countResult[0].count) }), { status: 200, headers });
        }
        
        if (req.method === 'POST' && action === 'view_promotion') {
            const body = await req.json();
            const { promotionId } = body;
            
            if (!promotionId) return new Response(JSON.stringify({ error: 'Missing promotionId' }), { status: 400, headers });
            
            await sql`
                INSERT INTO promotion_views (promotion_id, count, last_viewed)
                VALUES (${promotionId}, 1, NOW())
                ON CONFLICT (promotion_id) DO UPDATE SET 
                    count = promotion_views.count + 1,
                    last_viewed = NOW()
            `;
            
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        }

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
                    SELECT event_id, type, content, COUNT(*) as count 
                    FROM interactions 
                    WHERE event_id = ANY(${ids})
                    GROUP BY event_id, type, content
                `;

                const stats = {};
                ids.forEach(id => {
                    const auraRow = rows.find(r => r.event_id === id && r.type === 'aura');
                    const reactionRows = rows.filter(r => r.event_id === id && r.type === 'reaction');
                    const reactionCount = reactionRows.reduce((acc, r) => acc + parseInt(r.count), 0);
                    
                    stats[id] = {
                        aura: auraRow ? parseInt(auraRow.count) : 0,
                        reactions: reactionCount
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

                // Fetch Reactions
                const reactionsResult = await sql`
                    SELECT content, COUNT(*) as count 
                    FROM interactions 
                    WHERE event_id = ${eventId} AND type = 'reaction'
                    GROUP BY content
                `;
                
                const reactions = {};
                reactionsResult.forEach(r => {
                    reactions[r.content] = parseInt(r.count);
                });

                let userReaction = null;
                if (user.id && !user.id.startsWith('anon-')) {
                    const userReactionResult = await sql`
                        SELECT content FROM interactions 
                        WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'reaction'
                    `;
                    if (userReactionResult.length > 0) {
                        userReaction = userReactionResult[0].content;
                    }
                }

                return new Response(JSON.stringify({
                    auraCount,
                    hasUserAura,
                    comments: [],
                    reactions,
                    userReaction,
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

            // Reaction
            if (type === 'reaction') {
                if (!content) {
                     return new Response(JSON.stringify({ error: 'Reaction content required' }), { status: 400, headers });
                }
                
                // Check if user already reacted
                const existing = await sql`
                    SELECT id, content FROM interactions 
                    WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'reaction'
                `;

                if (existing && existing.length > 0) {
                    if (existing[0].content === content) {
                        // Same reaction -> remove it (toggle off)
                        await sql`DELETE FROM interactions WHERE id = ${existing[0].id}`;
                        return new Response(JSON.stringify({ success: true, action: 'removed' }), { status: 200, headers });
                    } else {
                        // Different reaction -> update it
                        await sql`
                            UPDATE interactions 
                            SET content = ${content}, created_at = ${new Date().toISOString()}
                            WHERE id = ${existing[0].id}
                        `;
                        return new Response(JSON.stringify({ success: true, action: 'updated' }), { status: 200, headers });
                    }
                } else {
                    // New reaction
                    const id = generateId();
                    await sql`
                        INSERT INTO interactions (id, event_id, user_id, type, content, created_at)
                        VALUES (${id}, ${eventId}, ${user.id}, 'reaction', ${content}, ${new Date().toISOString()})
                    `;
                    return new Response(JSON.stringify({ success: true, action: 'added' }), { status: 200, headers });
                }
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