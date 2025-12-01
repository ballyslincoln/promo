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
      return false;
    } catch (e) {
      console.error('Failed to add aura', e);
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
      return null;
    } catch (e) {
      console.error('Failed to add comment', e);
      return null;
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
    } catch (e) {
      console.error('Failed to get interactions', e);
    }
    return { auraCount: 0, comments: [], hasUserAura: false };
  }
};
