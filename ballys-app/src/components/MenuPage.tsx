import { Calendar, LogOut, ShieldCheck, ArrowRight, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import Footer from './Footer';

interface MenuPageProps {
    onSelect: (view: 'calendar' | 'dropsheet') => void;
    onLogout: () => void;
    onPrivacyClick?: () => void;
}

export default function MenuPage({ onSelect, onLogout, onPrivacyClick }: MenuPageProps) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 20
            }
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-ballys-red/30">
            {/* Static Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,0,0,0.1),rgba(0,0,0,0))]" />
                <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-gradient-to-br from-ballys-red/10 to-transparent rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gradient-to-tl from-blue-600/10 to-transparent rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="z-10 max-w-6xl w-full relative"
            >
                {/* Header */}
                <motion.header 
                    variants={itemVariants}
                    className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 px-4"
                >
                     <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-ballys-red to-red-500 rounded-2xl blur opacity-40" />
                            <div className="w-16 h-16 bg-surface/80 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-white/10 relative z-10">
                                <img src="/ballyb.png" className="w-9 h-9 object-contain drop-shadow-md" alt="Logo" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-text-main tracking-tighter mb-1">Admin<span className="text-ballys-red">Portal</span></h1>
                            <div className="flex items-center gap-2 text-text-muted/80 bg-surface/50 w-fit px-3 py-1 rounded-full border border-black/5 backdrop-blur-sm">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                <p className="text-[11px] font-bold uppercase tracking-widest">Secure Session Active</p>
                            </div>
                        </div>
                     </div>

                     <button 
                        onClick={onLogout} 
                        className="group flex items-center gap-3 text-sm font-semibold text-text-muted hover:text-red-500 px-6 py-3 rounded-full bg-surface/50 hover:bg-red-50/50 border border-transparent hover:border-red-100 transition-colors backdrop-blur-md"
                     >
                         <span>Sign Out</span>
                         <div className="bg-black/5 dark:bg-white/10 p-1 rounded-full group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors">
                            <LogOut className="w-4 h-4" />
                         </div>
                     </button>
                </motion.header>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-2 gap-8 px-2">
                    {/* Calendar Option */}
                    <motion.button
                        variants={itemVariants}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('calendar')}
                        className="group relative min-h-[26rem] bg-surface/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between items-start shadow-2xl hover:shadow-xl transition-shadow overflow-hidden text-left"
                    >
                        {/* Static Background Gradients */}
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] pointer-events-none" />
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-ballys-red/10 to-transparent rounded-full blur-[80px] -mr-20 -mt-20 opacity-60 mix-blend-overlay" />

                        {/* Icon */}
                        <div className="relative z-10 mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                                <Calendar className="w-8 h-8 text-ballys-red" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 mb-16">
                            <h2 className="text-3xl font-black text-text-main mb-3 tracking-tight">Calendar<br/><span className="text-ballys-red">Management</span></h2>
                            <p className="text-text-muted font-medium text-base leading-relaxed max-w-sm border-l-2 border-ballys-red/20 pl-4">
                                Manage daily events, promotions, and property schedules. The central hub for day-to-day operations.
                            </p>
                        </div>

                        {/* Action Indicator - Always Visible */}
                        <div className="absolute bottom-10 right-10 flex items-center gap-3 opacity-100">
                            <span className="text-xs font-bold uppercase tracking-widest text-ballys-red">Open Dashboard</span>
                            <div className="w-10 h-10 rounded-full bg-ballys-red text-white flex items-center justify-center shadow-lg shadow-red-500/20">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </motion.button>

                    {/* Drop Sheet Option */}
                    <motion.button
                        variants={itemVariants}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect('dropsheet')}
                        className="group relative min-h-[26rem] bg-surface/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between items-start shadow-2xl hover:shadow-xl transition-shadow overflow-hidden text-left"
                    >
                        {/* Static Background Gradients */}
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] pointer-events-none" />
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-[80px] -mr-20 -mt-20 opacity-60 mix-blend-overlay" />

                        {/* Icon */}
                        <div className="relative z-10 mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                                <PackageCheck className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 mb-16">
                            <h2 className="text-3xl font-black text-text-main mb-3 tracking-tight">Marketing<br/><span className="text-blue-600">Logistics</span></h2>
                            <p className="text-text-muted font-medium text-base leading-relaxed max-w-sm border-l-2 border-blue-500/20 pl-4">
                                Track direct mail campaigns, manage production milestones, and monitor delivery schedules.
                            </p>
                        </div>

                        {/* Action Indicator - Always Visible */}
                        <div className="absolute bottom-10 right-10 flex items-center gap-3 opacity-100">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Launch Module</span>
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </motion.button>
                </div>
                
                {/* Footer/Version */}
                <motion.div 
                    variants={itemVariants}
                    className="mt-12"
                >
                    <Footer onPrivacyClick={onPrivacyClick} />
                </motion.div>
            </motion.div>
        </div>
    );
}