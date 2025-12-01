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
        body: JSON.stringify({ eventId: commentId, type: 'like' })
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
          const newInteractions = interactions.filter(i => i.id !== existing.id);
          updateLocalInteractions(newInteractions);
          return false;
        } else {
          const interaction: Interaction = {
            id: generateId(),
            event_id: commentId,
            user_id: user.id,
            type: 'like',
            created_at: new Date().toISOString()
          };
          saveLocalInteraction(interaction);
          return true;
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

  // Get Stats for Events
  async getStatsForEvents(eventIds: string[]): Promise<Record<string, { aura: number, comments: number }>> {
    if (eventIds.length === 0) return {};

    // We should also merge local stats here if we want the dashboard to be accurate
    // But for now, let's just try API first
    try {
      const res = await fetch(`/api/interactions?action=stats&ids=${eventIds.join(',')}`);
      if (res.ok) {
        return await res.json();
      }
      throw new Error('API failed');
    } catch (e) {
      // Fallback to local storage
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
  },

  // Get Interactions for Event (Merged)
  async getEventInteractions(eventId: string): Promise<{ auraCount: number; comments: Interaction[]; hasUserAura: boolean; currentUser?: User; isOffline: boolean }> {
    let serverData = {
      auraCount: 0,
      comments: [] as Interaction[],
      hasUserAura: false,
      currentUser: undefined as User | undefined
    };
    let isOffline = false;

    try {
      const res = await fetch(`/api/interactions?eventId=${eventId}`);
      if (res.ok) {
        serverData = await res.json();
        if (serverData.currentUser) {
          localStorage.setItem('ballys_user', JSON.stringify(serverData.currentUser));
        }
      } else {
        throw new Error('API failed');
      }
    } catch (e) {
      console.warn('API unavailable, using local data', e);
      isOffline = true;
    }

    // Merge with local data
    const localInteractions = getLocalInteractions();
    const user = userService.getCurrentUser();

    // 1. Merge Comments
    const localComments = localInteractions.filter(i => i.event_id === eventId && i.type === 'comment');
    const serverCommentIds = new Set(serverData.comments.map(c => c.id));
    const uniqueLocalComments = localComments.filter(c => !serverCommentIds.has(c.id));

    const allComments = [...serverData.comments, ...uniqueLocalComments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const enrichedComments = allComments.map(c => {
      const localLikes = localInteractions.filter(i => i.event_id === c.id && i.type === 'like').length;
      const hasLocalLike = localInteractions.some(i => i.event_id === c.id && i.user_id === user?.id && i.type === 'like');

      const isLiked = c.hasLiked || hasLocalLike;
      // If server comment, it has server likes. If local, it has 0. Add local likes.
      // Note: This might double count if sync happens, but for now it's safe.
      const likeCount = (c.likes || 0) + (serverCommentIds.has(c.id) ? 0 : localLikes);

      return { ...c, hasLiked: isLiked, likes: likeCount };
    });

    // 2. Merge Aura
    const localAura = localInteractions.find(i => i.event_id === eventId && i.user_id === user?.id && i.type === 'aura');
    let hasUserAura = serverData.hasUserAura;
    let auraCount = serverData.auraCount;

    if (localAura && !hasUserAura) {
      hasUserAura = true;
      auraCount += 1;
    }

    return {
      auraCount,
      comments: enrichedComments,
      hasUserAura,
      currentUser: serverData.currentUser || user || undefined,
      isOffline
    };
  }
};
