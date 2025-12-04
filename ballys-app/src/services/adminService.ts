import type { Admin, ActivityLog } from '../types';

const API_URL = '/api/interactions'; // Netlify function base

export const adminService = {
    async login(pin: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
        try {
            const res = await fetch(`${API_URL}?action=admin_login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await res.json();
            if (res.ok) {
                return { success: true, admin: data.admin };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    },

    async getUsers(adminId: string): Promise<Admin[]> {
        try {
            const res = await fetch(`${API_URL}?action=admin_manage_users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestAdminId: adminId, method: 'list' })
            });
            if (res.ok) {
                const data = await res.json();
                return data.admins;
            }
            return [];
        } catch (e) {
            console.error('Error fetching admins:', e);
            return [];
        }
    },

    async createUser(adminId: string, userData: Partial<Admin>): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(`${API_URL}?action=admin_manage_users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestAdminId: adminId, method: 'create', data: userData })
            });
            const data = await res.json();
            if (res.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    },

    async updateUser(adminId: string, userData: Partial<Admin>): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(`${API_URL}?action=admin_manage_users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestAdminId: adminId, method: 'update', data: userData })
            });
            const data = await res.json();
            if (res.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    },

    async deleteUser(adminId: string, targetId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(`${API_URL}?action=admin_manage_users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestAdminId: adminId, method: 'delete', data: { id: targetId } })
            });
            const data = await res.json();
            if (res.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    },

    async getLogs(adminId: string): Promise<ActivityLog[]> {
        try {
            const res = await fetch(`${API_URL}?action=admin_logs&adminId=${adminId}`);
            if (res.ok) {
                const data = await res.json();
                return data.logs;
            }
            return [];
        } catch (e) {
            console.error('Error fetching logs:', e);
            return [];
        }
    }
};
