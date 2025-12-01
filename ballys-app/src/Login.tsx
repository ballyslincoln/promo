import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Share, PlusSquare, X } from 'lucide-react';

export default function Login({ onLogin, onAdminLogin }: { onLogin: () => void; onAdminLogin: () => void }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(true);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (code === '12345') {
            if (isAdminMode) {
                onAdminLogin();
            } else {
                onLogin();
            }
        } else {
            setError(true);
            setCode('');
            setTimeout(() => setError(false), 1000);
        }
    };

    useEffect(() => {
        if (code.length === 5) {
            handleSubmit();
        }
    }, [code, isAdminMode]);

    // Check if running in standalone mode (installed as PWA)
    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) {
            setShowInstallPrompt(false);
        }
    }, []);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-text-main relative overflow-hidden font-sans selection:bg-ballys-red/30">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-ballys-red/10 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-ballys-blue/10 rounded-full blur-[100px]"
                />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="z-10 w-full max-w-md relative px-4"
            >
                {/* Glass Card */}
                <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-slate-700/40 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden group transform-gpu">
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex flex-col items-center relative z-10">
                        {/* Logo Area */}
                        <motion.div
                            className="mb-10 relative"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        >
                            <div className="absolute inset-0 bg-ballys-red/10 blur-2xl rounded-full" />
                            <img src="/logo.png" alt="Bally's" className="h-20 md:h-24 relative z-10 drop-shadow-lg object-contain" />
                        </motion.div>

                        <h2 className="text-xs font-bold tracking-[0.3em] text-text-muted mb-6 uppercase text-center">Authorized Access Only</h2>

                        {/* Mode Toggle */}
                        <div className="w-full mb-6">
                            <div className="flex p-1.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-700/50 relative shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdminMode(false);
                                        setCode('');
                                        setError(false);
                                    }}
                                    className={`flex-1 py-3 px-4 text-[11px] font-bold uppercase tracking-[0.15em] relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${
                                        !isAdminMode ? 'text-ballys-red' : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    {!isAdminMode && (
                                        <motion.div
                                            layoutId="activeMode"
                                            className="absolute inset-0 bg-surface rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-border"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                    <User className="w-3.5 h-3.5 relative z-20" />
                                    <span className="relative z-20">Frontend</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdminMode(true);
                                        setCode('');
                                        setError(false);
                                    }}
                                    className={`flex-1 py-3 px-4 text-[11px] font-bold uppercase tracking-[0.15em] relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${
                                        isAdminMode ? 'text-ballys-red' : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    {isAdminMode && (
                                        <motion.div
                                            layoutId="activeMode"
                                            className="absolute inset-0 bg-surface rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-border"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                    <Settings className="w-3.5 h-3.5 relative z-20" />
                                    <span className="relative z-20">Admin</span>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                            {/* Passcode Display */}
                            <div className="relative w-full mb-8 h-16 flex items-center justify-center gap-2 md:gap-3">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={false}
                                        animate={{
                                            borderColor: error ? 'rgba(239, 68, 68, 0.5)' : isFocused && i === code.length ? 'rgba(230, 0, 0, 0.5)' : 'rgba(128, 128, 128, 0.2)',
                                            scale: isFocused && i === code.length ? 1.1 : 1,
                                            backgroundColor: code[i] ? 'rgba(230, 0, 0, 0.05)' : 'transparent',
                                            boxShadow: isFocused && i === code.length ? '0 0 20px rgba(230,0,0,0.1)' : 'none',
                                            color: code[i] ? '#E60000' : 'transparent'
                                        }}
                                        className={`w-10 h-12 md:w-12 md:h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-mono transition-colors duration-200`}
                                    >
                                        {code[i] ? '•' : ''}
                                    </motion.div>
                                ))}

                                {/* Hidden Input */}
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={5}
                                    value={code}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        if (val.length <= 5) setCode(val);
                                    }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer font-mono text-[16px] z-50"
                                    autoFocus
                                />
                            </div>

                            {/* Status/Error Message */}
                            <div className="h-6 flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {error ? (
                                        <motion.span
                                            key="error"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="text-red-500 text-xs tracking-widest font-medium uppercase flex items-center gap-2"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            Access Denied
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            key="hint"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-text-muted/50 text-xs tracking-widest uppercase"
                                        >
                                            {isAdminMode ? 'Admin Access' : 'Enter 5-Digit PIN'}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>

            {/* Install Prompt - Bottom Sheet Style */}
            <AnimatePresence>
                {showInstallPrompt && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute bottom-0 left-0 right-0 z-50 p-4 flex justify-center"
                    >
                        <div className="bg-surface/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl max-w-[340px] w-full p-4 relative overflow-hidden">
                            <button 
                                onClick={() => setShowInstallPrompt(false)}
                                className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-text-muted" />
                            </button>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0 border border-border mt-1">
                                    <img src="/ballyb.png" className="w-6 h-6 object-contain" alt="App Icon" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-text-main text-xs mb-0.5">Install App</h3>
                                    <p className="text-[10px] text-text-muted mb-2 leading-snug">
                                        Add to home screen for quick access.
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-[9px] text-text-light uppercase tracking-wider font-bold">
                                            <span>1. Tap</span>
                                            <Share className="w-3 h-3" />
                                        </div>
                                        <div className="w-px h-3 bg-border" />
                                        <div className="flex items-center gap-1.5 text-[9px] text-text-light uppercase tracking-wider font-bold">
                                            <span>2. Add to Home</span>
                                            <PlusSquare className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-8 text-text-muted/30 text-[10px] tracking-[0.2em] font-light">
                SECURE ACCESS SYSTEM v2.0
            </div>
        </div>
    );
}