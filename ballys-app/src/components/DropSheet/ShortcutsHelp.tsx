import { X, Command, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    { key: 'N', label: 'New Job' },
    { key: 'S', label: 'Toggle Selection Mode' },
    { key: 'D', label: 'Duplicate Analysis' },
    { key: 'E', label: 'Export to JSON' },
    { key: 'I', label: 'Import JSON' },
    { key: '←/→', label: 'Navigate Months' },
    { key: 'Del', label: 'Delete Selected' },
    { key: 'Esc', label: 'Cancel / Close' },
    { key: '?', label: 'Toggle Help' },
];

export default function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto z-50 max-w-md h-fit bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-ballys-red/10 rounded-lg text-ballys-red">
                                    <Keyboard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main">Keyboard Shortcuts</h3>
                                    <p className="text-xs text-text-muted">Power user controls</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>
                        
                        <div className="p-2">
                            <div className="grid grid-cols-1 gap-1">
                                {SHORTCUTS.map((shortcut, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group">
                                        <span className="text-sm font-medium text-text-muted group-hover:text-text-main transition-colors">
                                            {shortcut.label}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-text-main shadow-sm min-w-[2rem] text-center font-mono">
                                                {shortcut.key}
                                            </kbd>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 text-center border-t border-border">
                            <p className="text-xs text-text-muted flex items-center justify-center gap-2">
                                <Command className="w-3 h-3" />
                                Press <span className="font-bold text-text-main">?</span> anytime to view this menu
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
