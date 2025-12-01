import { sql } from '../db';
import type { Interaction, User } from '../types';
import { generateId } from '../utils';
import { userService } from './userService';

const LOCAL_STORAGE_KEY = 'ballys_interactions';

const getLocalInteractions = (): Interaction[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalInteraction = (interaction: Interaction) => {
  const current = getLocalInteractions();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...current, interaction]));
};

const updateLocalInteractions = (interactions: Interaction[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(interactions));
};

export const interactionService = {
  // Add +1 Aura
  async addAura(eventId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, type: 'aura' })
      });

      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
      throw new Error('API failed');
    } catch (e) {
      console.warn('API unavailable, falling back to direct DB', e);

      const user = await userService.getOrCreateUser();
      if (!user) return false;

      if (!sql) {
        // LocalStorage Fallback
        const interactions = getLocalInteractions();
        const existing = interactions.find(i =>
          i.event_id === eventId &&
          i.user_id === user.id &&
          i.type === 'aura'
        );

        if (existing) return false;

        const interaction: Interaction = {
          id: generateId(),
          event_id: eventId,
          user_id: user.id,
          type: 'aura',
          created_at: new Date().toISOString()
        };
        saveLocalInteraction(interaction);
        return true;
      }

      try {
        // Check duplicate
        const existing = await sql`
            SELECT id FROM interactions 
            WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'aura'
        `;

        if (existing && existing.length > 0) {
          return false;
        }

        const id = generateId();
        await sql`
            INSERT INTO interactions (id, event_id, user_id, type, created_at)
            VALUES (${id}, ${eventId}, ${user.id}, 'aura', ${new Date().toISOString()})
        `;
        return true;
      } catch (dbError) {
        console.error('DB fallback failed', dbError);
        return false;
      }
    }
  },

  // Add Comment
  async addComment(eventId: string, content: string): Promise<Interaction | null> {
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, type: 'comment', content })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.interaction) {
          return data.interaction;
        }
      }
      throw new Error('API failed');
    } catch (e) {
      console.warn('API unavailable, falling back to direct DB', e);

      const user = await userService.getOrCreateUser();
      if (!user) return null;

      if (!sql) {
        // LocalStorage Fallback
        const interactions = getLocalInteractions();
        const lastComment = interactions
          .filter(i => i.user_id === user.id && i.type === 'comment')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        if (lastComment) {
          const lastTime = new Date(lastComment.created_at).getTime();
          const now = new Date().getTime();
          if (now - lastTime < 5000) return null; // Rate limit
        }

        const interaction: Interaction = {
          id: generateId(),
          event_id: eventId,
          user_id: user.id,
          type: 'comment',
          content,
          created_at: new Date().toISOString(),
          username: user.username,
          likes: 0,
          hasLiked: false
        };
        saveLocalInteraction(interaction);
        return interaction;
      }

      try {
        // Rate limit check (simple)
        const lastComment = await sql`
            SELECT created_at FROM interactions
            WHERE user_id = ${user.id} AND type = 'comment'
            ORDER BY created_at DESC
            LIMIT 1
        `;

        if (lastComment.length > 0) {
          const lastTime = new Date(lastComment[0].created_at).getTime();
          const now = new Date().getTime();
          if (now - lastTime < 5000) {
            return null;
          }
        }

        const id = generateId();
        const timestamp = new Date().toISOString();

        await sql`
            INSERT INTO interactions (id, event_id, user_id, type, content, created_at)
            VALUES (${id}, ${eventId}, ${user.id}, 'comment', ${content}, ${timestamp})
        `;

        return {
          id,
          event_id: eventId,
          user_id: user.id,
          type: 'comment',
          content,
          created_at: timestamp,
          username: user.username,
          likes: 0,
          hasLiked: false
        };
      } catch (dbError) {
        console.error('DB fallback failed', dbError);
        return null;
      }
    }
  },

  // Delete Interaction
  async deleteInteraction(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/interactions?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      }
      throw new Error('API failed');
    } catch (e) {
      console.warn('API unavailable, falling back to direct DB', e);

      if (!sql) {
        const interactions = getLocalInteractions();
        const newInteractions = interactions.filter(i => i.id !== id);
        updateLocalInteractions(newInteractions);
        return true;
      }

      try {
        const user = await userService.getOrCreateUser();
        if (!user) return false;

        // In direct DB mode, we can only delete our own. 
        // Admin check is tricky without auth token, but we'll assume the UI protects it mostly.
        // Backend API handles the real check.
        await sql`
            DELETE FROM interactions 
            WHERE id = ${id} AND (user_id = ${user.id}) 
        `;
        return true;
      } catch (dbError) {
        console.error('DB fallback failed', dbError);
        return false;
      }
    }
  },

  // Toggle Like
  async toggleLike(commentId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: commentId, type: 'like' }) // We treat commentId as eventId for 'like' type
      });
      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
      throw new Error('API failed');
    } catch (e) {
      console.warn('API unavailable, falling back to direct DB', e);

      const user = await userService.getOrCreateUser();
      if (!user) return false;

      if (!sql) {
        const interactions = getLocalInteractions();
        const existing = interactions.find(i => i.event_id === commentId && i.user_id === user.id && i.type === 'like');

        if (existing) {
          // Unlike
          const newInteractions = interactions.filter(i => i.id !== existing.id);
          updateLocalInteractions(newInteractions);
          return false; // Liked -> Unliked
        } else {
          // Like
          const interaction: Interaction = {
            id: generateId(),
            event_id: commentId, // Linking to comment
            user_id: user.id,
            type: 'like',
            created_at: new Date().toISOString()
          };
          saveLocalInteraction(interaction);
          return true; // Unliked -> Liked
        }
      }

      try {
        const existing = await sql`
                  SELECT id FROM interactions 
                  WHERE event_id = ${commentId} AND user_id = ${user.id} AND type = 'like'
              `;

        if (existing && existing.length > 0) {
          await sql`DELETE FROM interactions WHERE id = ${existing[0].id}`;
          return false;
        } else {
          const id = generateId();
          await sql`
                      INSERT INTO interactions (id, event_id, user_id, type, created_at)
                      VALUES (${id}, ${commentId}, ${user.id}, 'like', ${new Date().toISOString()})
                  `;
          return true;
        }
      } catch (dbError) {
        console.error('DB fallback failed', dbError);
        return false;
      }
    }
  },

  // Get Stats for Events (Aura + Comment Counts)
  async getStatsForEvents(eventIds: string[]): Promise<Record<string, { aura: number, comments: number }>> {
    if (eventIds.length === 0) return {};

    try {
      const res = await fetch(`/api/interactions?action=stats&ids=${eventIds.join(',')}`);
      if (res.ok) {
        return await res.json();
      }
      throw new Error('API failed');
    } catch (e) {
      if (!sql) {
        const interactions = getLocalInteractions();
        const stats: Record<string, { aura: number, comments: number }> = {};

        eventIds.forEach(id => {
          stats[id] = {
            aura: interactions.filter(i => i.event_id === id && i.type === 'aura').length,
            comments: interactions.filter(i => i.event_id === id && i.type === 'comment').length
          };
        });
        return stats;
      }

      try {
        const stats: Record<string, { aura: number, comments: number }> = {};
        // Fetch all interactions for these events
        // Note: This might be heavy if lots of events, but for a dashboard page it's okay
        const rows = await sql`
                SELECT event_id, type, COUNT(*) as count 
                FROM interactions 
                WHERE event_id = ANY(${eventIds})
                GROUP BY event_id, type
             `;

        eventIds.forEach(id => {
          const auraRow = rows.find((r: any) => r.event_id === id && r.type === 'aura');
          const commentRow = rows.find((r: any) => r.event_id === id && r.type === 'comment');
          stats[id] = {
            aura: auraRow ? parseInt(auraRow.count) : 0,
            comments: commentRow ? parseInt(commentRow.count) : 0
          };
        });
        return stats;
      } catch (e) {
        return {};
      }
    }
  },

  // Get Interactions for Event
  async getEventInteractions(eventId: string): Promise<{ auraCount: number; comments: Interaction[]; hasUserAura: boolean; currentUser?: User }> {
    try {
      const res = await fetch(`/api/interactions?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();

        // Update local user cache if returned
        if (data.currentUser) {
          localStorage.setItem('ballys_user', JSON.stringify(data.currentUser));
        }

        return {
          auraCount: data.auraCount || 0,
          comments: data.comments || [],
          hasUserAura: data.hasUserAura || false,
          currentUser: data.currentUser
        };
      }
      throw new Error('API failed');
    } catch (e) {
      console.warn('API unavailable, falling back to direct DB', e);

      const user = await userService.getOrCreateUser();
      if (!user) return { auraCount: 0, comments: [], hasUserAura: false };

      if (!sql) {
        // LocalStorage Fallback
        const interactions = getLocalInteractions();

        const auraCount = interactions.filter(i => i.event_id === eventId && i.type === 'aura').length;
        const hasUserAura = interactions.some(i => i.event_id === eventId && i.user_id === user.id && i.type === 'aura');

        // Get comments and enrich with likes
        const rawComments = interactions
          .filter(i => i.event_id === eventId && i.type === 'comment')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const comments = rawComments.map(c => {
          const likes = interactions.filter(i => i.event_id === c.id && i.type === 'like').length;
          const hasLiked = interactions.some(i => i.event_id === c.id && i.user_id === user.id && i.type === 'like');
          return { ...c, likes, hasLiked };
        });

        return {
          auraCount,
          comments,
          hasUserAura,
          currentUser: user
        };
      }

      try {
        const auraResult = await sql`
            SELECT COUNT(*) as count FROM interactions 
            WHERE event_id = ${eventId} AND type = 'aura'
        `;
        const auraCount = parseInt(auraResult[0].count);

        const userAura = await sql`
            SELECT id FROM interactions 
            WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'aura'
        `;
        const hasUserAura = userAura.length > 0;

        const commentsResult = await sql`
            SELECT i.*, u.username 
            FROM interactions i
            JOIN users u ON i.user_id = u.id
            WHERE i.event_id = ${eventId} AND i.type = 'comment'
            ORDER BY i.created_at DESC
        `;

        // Fetch likes for these comments
        // We can do this efficiently or lazily. Let's do a subquery or join if possible, 
        // but for now separate query is safer for compatibility.
        const commentIds = commentsResult.map((c: any) => c.id);
        let likesMap: Record<string, number> = {};
        let userLikesMap: Record<string, boolean> = {};

        if (commentIds.length > 0) {
          const likesResult = await sql`
                SELECT event_id, COUNT(*) as count 
                FROM interactions 
                WHERE type = 'like' AND event_id = ANY(${commentIds})
                GROUP BY event_id
            `;
          likesResult.forEach((r: any) => likesMap[r.event_id] = parseInt(r.count));

          const userLikesResult = await sql`
                SELECT event_id FROM interactions 
                WHERE type = 'like' AND user_id = ${user.id} AND event_id = ANY(${commentIds})
            `;
          userLikesResult.forEach((r: any) => userLikesMap[r.event_id] = true);
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

        return {
          auraCount,
          comments,
          hasUserAura,
          currentUser: user
        };

      } catch (dbError) {
        console.error('DB fallback failed', dbError);
        return { auraCount: 0, comments: [], hasUserAura: false };
      }
    }
  }
};
