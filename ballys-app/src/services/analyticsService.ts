const API_URL = '/.netlify/functions/api';

export const analyticsService = {
  async sendHeartbeat(location: string = 'global'): Promise<{ total: number, locationCount: number }> {
    try {
      const response = await fetch(`${API_URL}?action=heartbeat&location=${encodeURIComponent(location)}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
    return { total: 0, locationCount: 0 };
  },

  async trackPromotionView(promotionId: string): Promise<void> {
    try {
      await fetch(`${API_URL}?action=view_promotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotionId }),
      });
    } catch (error) {
      console.error('Failed to track promotion view:', error);
    }
  }
};

