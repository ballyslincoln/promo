import { sql } from '../db';
import type { Interaction } from '../types';
import { userService } from './userService';

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const interactionService = {
  // Add +1 Aura
  async addAura(eventId: string): Promise<boolean> {
    const user = userService.getCurrentUser();
    if (!user || !sql) return false;

    try {
      // Check if already added aura
      const existing = await sql`
        SELECT id FROM interactions 
        WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'aura'
      `;

      if (existing && existing.length > 0) {
        return false; // Already added
      }

      const id = generateId();
      await sql`
        INSERT INTO interactions (id, event_id, user_id, type, created_at)
        VALUES (${id}, ${eventId}, ${user.id}, 'aura', ${new Date().toISOString()})
      `;
      return true;
    } catch (e) {
      console.error('Failed to add aura', e);
      return false;
    }
  },

  // Add Comment
  async addComment(eventId: string, content: string): Promise<Interaction | null> {
    const user = userService.getCurrentUser();
    if (!user || !sql) return null;

    const id = generateId();
    const timestamp = new Date().toISOString();

    try {
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
    } catch (e) {
      console.error('Failed to add comment', e);
      return null;
    }
  },

  // Get Interactions for Event
  async getEventInteractions(eventId: string): Promise<{ auraCount: number; comments: Interaction[]; hasUserAura: boolean }> {
    if (!sql) return { auraCount: 0, comments: [], hasUserAura: false };

    const user = userService.getCurrentUser();

    try {
      // Get Aura Count
      const auraResult = await sql`
        SELECT COUNT(*) as count FROM interactions 
        WHERE event_id = ${eventId} AND type = 'aura'
      `;
      const auraCount = parseInt(auraResult[0].count);

      // Check if user has aura
      let hasUserAura = false;
      if (user) {
        const userAura = await sql`
            SELECT id FROM interactions 
            WHERE event_id = ${eventId} AND user_id = ${user.id} AND type = 'aura'
        `;
        hasUserAura = userAura.length > 0;
      }

      // Get Comments with usernames
      // Join with users table to get current username (in case it changed, though unlikely)
      const commentsResult = await sql`
        SELECT i.*, u.username 
        FROM interactions i
        JOIN users u ON i.user_id = u.id
        WHERE i.event_id = ${eventId} AND i.type = 'comment'
        ORDER BY i.created_at DESC
      `;

      const comments = commentsResult.map((r: any) => ({
        id: r.id,
        event_id: r.event_id,
        user_id: r.user_id,
        type: r.type,
        content: r.content,
        created_at: r.created_at,
        username: r.username
      })) as Interaction[];

      return { auraCount, comments, hasUserAura };
    } catch (e) {
      console.error('Failed to get interactions', e);
      return { auraCount: 0, comments: [], hasUserAura: false };
    }
  }
};
