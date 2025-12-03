import { Calendar, Truck, LogOut, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MenuPageProps {
    onSelect: (view: 'calendar' | 'dropsheet') => void;
    onLogout: () => void;
}

export default function MenuPage({ onSelect, onLogout }: MenuPageProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background - Enhanced */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-ballys-red/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
            </div>

            <div className="z-10 max-w-5xl w-full">
                <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-surface/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shadow-xl shadow-black/5 ring-1 ring-black/5">
                             <img src="/ballyb.png" className="w-8 h-8 object-contain drop-shadow-sm" alt="Logo" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-text-main tracking-tight">Admin Portal</h1>
                            <div className="flex items-center gap-2 text-text-muted">
                                <ShieldCheck className="w-3 h-3" />
                                <p className="text-xs font-medium uppercase tracking-widest">Authorized Session</p>
                            </div>
                        </div>
                     </div>
                     <button 
                        onClick={onLogout} 
                        className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-main px-5 py-2.5 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-all group"
                     >
                         <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                         Logout
                     </button>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Calendar Option */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('calendar')}
                        className="group relative h-80 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex flex-col justify-between items-start shadow-2xl hover:shadow-ballys-red/10 transition-all overflow-hidden text-left"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-ballys-red/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="p-5 bg-white dark:bg-white/5 border border-black/5 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 origin-top-left shadow-sm">
                            <Calendar className="w-8 h-8 text-ballys-red" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-text-main mb-3 group-hover:text-ballys-red transition-colors">Calendar Management</h2>
                            <p className="text-text-muted text-base leading-relaxed max-w-sm">
                                Manage daily events, promotions, and property schedules. The central hub for day-to-day operations.
                            </p>
                        </div>

                        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2 text-ballys-red font-bold text-sm bg-ballys-red/5 px-4 py-2 rounded-full">
                            Access Dashboard <span className="text-lg">→</span>
                        </div>
                    </motion.button>

                    {/* Drop Sheet Option */}
                    <motion.button
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('dropsheet')}
                        className="group relative h-80 bg-surface/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 flex flex-col justify-between items-start shadow-2xl hover:shadow-blue-500/10 transition-all overflow-hidden text-left"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="p-5 bg-white dark:bg-white/5 border border-black/5 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 origin-top-left shadow-sm">
                            <Truck className="w-8 h-8 text-blue-600" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-text-main mb-3 group-hover:text-blue-600 transition-colors">Marketing Logistics</h2>
                            <p className="text-text-muted text-base leading-relaxed max-w-sm">
                                Track direct mail campaigns, manage production milestones, and monitor delivery schedules.
                            </p>
                        </div>

                        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-500/5 px-4 py-2 rounded-full">
                            Launch Module <span className="text-lg">→</span>
                        </div>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
