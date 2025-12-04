import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Trash2, Edit2, Plus, X, Save, ArrowLeft, Loader2 } from 'lucide-react';
import type { Admin } from '../types';
import { adminService } from '../services/adminService';

interface UserManagementProps {
    adminUser: Admin | null;
    onBack: () => void;
}

export default function UserManagement({ adminUser, onBack }: UserManagementProps) {
    const [users, setUsers] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null); // ID of user being edited, or 'new'
    const [formData, setFormData] = useState<Partial<Admin>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (adminUser?.id) {
            loadUsers();
        }
    }, [adminUser]);

    const loadUsers = async () => {
        if (!adminUser) return;
        setLoading(true);
        const data = await adminService.getUsers(adminUser.id);
        setUsers(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!adminUser) return;
        setError(null);
        
        if (!formData.username || !formData.pin) {
            setError("Username and PIN are required");
            return;
        }

        if (isEditing === 'new') {
            const res = await adminService.createUser(adminUser.id, formData);
            if (res.success) {
                setIsEditing(null);
                setFormData({});
                loadUsers();
            } else {
                setError(res.error || 'Failed to create user');
            }
        } else if (isEditing) {
            const res = await adminService.updateUser(adminUser.id, { ...formData, id: isEditing });
            if (res.success) {
                setIsEditing(null);
                setFormData({});
                loadUsers();
            } else {
                setError(res.error || 'Failed to update user');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!adminUser || !confirm('Are you sure you want to delete this user?')) return;
        const res = await adminService.deleteUser(adminUser.id, id);
        if (res.success) {
            loadUsers();
        } else {
            alert(res.error || 'Failed to delete user');
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 relative">
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} className="p-2 hover:bg-surface rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-text-muted" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">User Management</h1>
                        <p className="text-text-muted text-sm">Manage admin access and permissions</p>
                    </div>
                    <div className="ml-auto">
                        <button
                            onClick={() => {
                                setIsEditing('new');
                                setFormData({ role: 'admin' });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-ballys-red text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add User</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 text-ballys-red animate-spin" />
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                             {/* New User Form */}
                             <AnimatePresence>
                                {isEditing === 'new' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-ballys-red/5"
                                    >
                                        <div className="p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-ballys-red/10 flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-ballys-red" />
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Username"
                                                    value={formData.username || ''}
                                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-border focus:outline-none focus:border-ballys-red"
                                                />
                                                <input
                                                    type="text" // Using text for visibility, could be password type
                                                    placeholder="PIN (5 digits)"
                                                    maxLength={5}
                                                    value={formData.pin || ''}
                                                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-border focus:outline-none focus:border-ballys-red"
                                                />
                                                <select
                                                    value={formData.role || 'admin'}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-border focus:outline-none focus:border-ballys-red"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="master">Master</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={handleSave} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setIsEditing(null); setFormData({}); setError(null); }} className="p-2 bg-gray-200 dark:bg-gray-700 text-text-muted rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {error && (
                                            <div className="px-4 pb-4 text-red-500 text-sm font-medium">
                                                {error}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                             </AnimatePresence>

                            {users.map(user => (
                                <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-surface/50 transition-colors">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${user.role === 'master' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'}`}>
                                        {user.role === 'master' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                    </div>
                                    
                                    {isEditing === user.id ? (
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <input
                                                type="text"
                                                value={formData.username || ''}
                                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-border"
                                            />
                                            <input
                                                type="text"
                                                value={formData.pin || ''}
                                                maxLength={5}
                                                onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-border"
                                            />
                                            <div className="flex items-center text-sm text-text-muted px-2">
                                                {user.role === 'master' ? 'Master Admin (Cannot Change Role)' : 'Admin'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-text-main">{user.username}</span>
                                                {user.id === adminUser?.id && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-0.5 rounded-full">You</span>}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-text-muted mt-0.5">
                                                <span className="uppercase tracking-wider font-bold">{user.role}</span>
                                                <span>PIN: •••••</span>
                                                <span>Last Login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        {isEditing === user.id ? (
                                            <>
                                                <button onClick={handleSave} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setIsEditing(null); setFormData({}); }} className="p-2 bg-gray-200 dark:bg-gray-700 text-text-muted rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => { setIsEditing(user.id); setFormData({ username: user.username, pin: user.pin, role: user.role }); }} 
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-text-muted rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {user.role !== 'master' && user.id !== adminUser?.id && (
                                                    <button 
                                                        onClick={() => handleDelete(user.id)} 
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {users.length === 0 && (
                                <div className="p-8 text-center text-text-muted text-sm">
                                    No users found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
