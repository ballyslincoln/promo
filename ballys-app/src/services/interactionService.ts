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
          username: user.username
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
          username: user.username
        };
      } catch (dbError) {
        console.error('DB fallback failed', dbError);
        return null;
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
        const comments = interactions
          .filter(i => i.event_id === eventId && i.type === 'comment')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

        const comments = commentsResult.map(r => ({
          id: r.id,
          event_id: r.event_id,
          user_id: r.user_id,
          type: r.type,
          content: r.content,
          created_at: r.created_at,
          username: r.username
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
