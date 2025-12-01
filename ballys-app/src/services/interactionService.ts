import type { Interaction, User } from '../types';

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
      console.error('Failed to add aura:', await res.text());
      return false;
    } catch (e) {
      console.error('Error adding aura:', e);
      return false;
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
      console.error('Failed to add comment:', await res.text());
      return null;
    } catch (e) {
      console.error('Error adding comment:', e);
      return null;
    }
  },

  // Delete Interaction
  async deleteInteraction(id: string, isAdmin = false): Promise<boolean> {
    try {
      const res = await fetch(`/api/interactions?id=${id}&isAdmin=${isAdmin}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return true;
      }
      console.error('Failed to delete interaction:', await res.text());
      return false;
    } catch (e) {
      console.error('Error deleting interaction:', e);
      return false;
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
      console.error('Failed to toggle like:', await res.text());
      return false;
    } catch (e) {
      console.error('Error toggling like:', e);
      return false;
    }
  },

  // Get Stats for Events
  async getStatsForEvents(eventIds: string[]): Promise<Record<string, { aura: number, comments: number }>> {
    if (eventIds.length === 0) return {};

    try {
      const res = await fetch(`/api/interactions?action=stats&ids=${eventIds.join(',')}`);
      if (res.ok) {
        return await res.json();
      }
      console.error('Failed to get stats:', await res.text());
      return {};
    } catch (e) {
      console.error('Error getting stats:', e);
      return {};
    }
  },

  // Get Interactions for Event
  async getEventInteractions(eventId: string): Promise<{ auraCount: number; comments: Interaction[]; hasUserAura: boolean; currentUser?: User }> {
    try {
      const res = await fetch(`/api/interactions?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.currentUser) {
          // Update local cache of user if provided by server
          localStorage.setItem('ballys_user', JSON.stringify(data.currentUser));
        }
        return data;
      }
      console.error('Failed to get event interactions:', await res.text());
      return {
        auraCount: 0,
        comments: [],
        hasUserAura: false
      };
    } catch (e) {
      console.error('Error getting event interactions:', e);
      return {
        auraCount: 0,
        comments: [],
        hasUserAura: false
      };
    }
  }
};
