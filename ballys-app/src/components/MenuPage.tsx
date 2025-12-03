import { Calendar, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MenuPageProps {
    onSelect: (view: 'calendar' | 'dropsheet') => void;
    onLogout: () => void;
}

export default function MenuPage({ onSelect, onLogout }: MenuPageProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background - reusing from Login for consistency */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-ballys-red/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-ballys-blue/5 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 max-w-4xl w-full">
                <header className="flex justify-between items-center mb-12">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center shadow-sm">
                             <img src="/ballyb.png" className="w-6 h-6 object-contain" alt="Logo" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text-main">Admin Portal</h1>
                            <p className="text-xs text-text-muted uppercase tracking-widest">Authorized Session</p>
                        </div>
                     </div>
                     <button onClick={onLogout} className="text-sm text-text-muted hover:text-text-main px-4 py-2 rounded-lg hover:bg-surface transition-colors">
                         Logout
                     </button>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Calendar Option */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('calendar')}
                        className="group relative h-64 bg-surface border border-border rounded-3xl p-8 flex flex-col justify-between items-start shadow-xl hover:shadow-2xl transition-all overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-ballys-red/5 rounded-full -mr-16 -mt-16 group-hover:bg-ballys-red/10 transition-colors" />
                        
                        <div className="p-4 bg-ballys-red/10 text-ballys-red rounded-2xl mb-4 group-hover:scale-110 transition-transform origin-top-left">
                            <Calendar className="w-8 h-8" />
                        </div>

                        <div className="relative z-10 text-left">
                            <h2 className="text-2xl font-bold text-text-main mb-2">Edit Events</h2>
                            <p className="text-text-muted text-sm leading-relaxed">
                                Manage calendar events, promotions, and daily schedules. The legacy admin view.
                            </p>
                        </div>

                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                            <span className="text-ballys-red font-bold text-sm flex items-center gap-2">
                                Access Dashboard →
                            </span>
                        </div>
                    </motion.button>

                    {/* Drop Sheet Option */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('dropsheet')}
                        className="group relative h-64 bg-surface border border-border rounded-3xl p-8 flex flex-col justify-between items-start shadow-xl hover:shadow-2xl transition-all overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
                        
                        <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform origin-top-left">
                            <Truck className="w-8 h-8" />
                        </div>

                        <div className="relative z-10 text-left">
                            <h2 className="text-2xl font-bold text-text-main mb-2">Drop Sheet</h2>
                            <p className="text-text-muted text-sm leading-relaxed">
                                Marketing logistics, direct mail tracking, and production milestones.
                            </p>
                        </div>

                         <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                            <span className="text-blue-600 font-bold text-sm flex items-center gap-2">
                                Launch Module →
                            </span>
                        </div>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
