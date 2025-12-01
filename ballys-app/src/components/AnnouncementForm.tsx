import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Announcement, AnnouncementType } from '../types';

export default function AnnouncementForm({
    announcement,
    onSave,
    onDelete,
    onCancel
}: {
    announcement: Announcement | null;
    onSave: (ann: Announcement) => void;
    onDelete: (id: string) => void;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState<Announcement>(announcement || {
        id: `ann-${Date.now()}`,
        message: '',
        type: 'info',
        active: true,
        createdAt: new Date().toISOString()
    });

    useEffect(() => {
        if (announcement) setFormData(announcement);
    }, [announcement]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
           <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-sm">
               <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-text-main">
                       {announcement ? 'Edit Alert' : 'New Alert'}
                   </h2>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
               </div>

               <div className="space-y-4">
                   <div>
                       <label className="block text-sm font-medium mb-1 text-text-main">Message</label>
                       <textarea 
                           value={formData.message}
                           onChange={e => setFormData({...formData, message: e.target.value})}
                           className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                           rows={3}
                           placeholder="e.g. Casino closed due to blizzard"
                       />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-medium mb-1 text-text-main">Type</label>
                           <select
                               value={formData.type}
                               onChange={e => setFormData({...formData, type: e.target.value as AnnouncementType})}
                               className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                           >
                               <option value="info">Info (Blue)</option>
                               <option value="warning">Warning (Yellow)</option>
                               <option value="error">Error (Red)</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-sm font-medium mb-1 text-text-main">Expiration</label>
                           <input
                               type="datetime-local"
                               value={formData.expirationDate ? formData.expirationDate.slice(0, 16) : ''}
                               onChange={e => setFormData({...formData, expirationDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                               className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                           />
                       </div>
                   </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-border">
                        <input
                            type="checkbox"
                            id="active"
                            checked={formData.active}
                            onChange={e => setFormData({...formData, active: e.target.checked})}
                            className="w-5 h-5 rounded border-gray-300 text-ballys-red focus:ring-ballys-red"
                        />
                        <label htmlFor="active" className="font-medium text-text-main cursor-pointer select-none">
                            Active / Visible
                        </label>
                    </div>

                   <div className="flex gap-3 pt-4">
                       {announcement && (
                           <button
                               onClick={() => onDelete(announcement.id)}
                               className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                           >
                               Delete
                           </button>
                       )}
                       <div className="flex-1" />
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-surface border border-border text-text-main hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(formData)}
                            disabled={!formData.message}
                            className="px-4 py-2 bg-ballys-red hover:bg-ballys-darkRed text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Alert
                        </button>
                   </div>
               </div>
           </div>
        </motion.div>
    );
}
