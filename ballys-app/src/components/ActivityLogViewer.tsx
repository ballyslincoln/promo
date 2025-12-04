import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowLeft, Calendar, Search, Loader2 } from 'lucide-react';
import { Admin, ActivityLog } from '../types';
import { adminService } from '../services/adminService';

interface ActivityLogViewerProps {
    adminUser: Admin | null;
    onBack: () => void;
}

export default function ActivityLogViewer({ adminUser, onBack }: ActivityLogViewerProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (adminUser?.id) {
            loadLogs();
        }
    }, [adminUser]);

    const loadLogs = async () => {
        if (!adminUser) return;
        setLoading(true);
        const data = await adminService.getLogs(adminUser.id);
        setLogs(data);
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => 
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.action_type.toLowerCase().includes(search.toLowerCase())
    );

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
                        <h1 className="text-2xl font-bold text-text-main">Activity Logs</h1>
                        <p className="text-text-muted text-sm">Audit trail of admin actions</p>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ballys-red/20 transition-all"
                    />
                </div>

                {/* Content */}
                <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 text-ballys-red animate-spin" />
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                             {filteredLogs.map(log => (
                                <div key={log.id} className="p-4 hover:bg-surface/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                log.action_type === 'login' ? 'bg-blue-500/10 text-blue-600' : 
                                                log.action_type.includes('delete') ? 'bg-red-500/10 text-red-600' :
                                                'bg-green-500/10 text-green-600'
                                            }`}>
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-text-main text-sm">{log.admin_name || 'Unknown'}</span>
                                                    <span className="text-xs text-text-muted px-1.5 py-0.5 bg-surface border border-border rounded-md uppercase tracking-wide">{log.action_type}</span>
                                                </div>
                                                <p className="text-sm text-text-main mt-0.5">{log.description}</p>
                                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                    <pre className="mt-2 text-[10px] bg-black/5 dark:bg-black/20 p-2 rounded border border-border overflow-x-auto max-w-lg text-text-muted">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                             ))}
                             
                             {filteredLogs.length === 0 && (
                                <div className="p-8 text-center text-text-muted text-sm">
                                    No logs found.
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
