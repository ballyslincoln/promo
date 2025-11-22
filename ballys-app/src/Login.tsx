import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings } from 'lucide-react';

export default function Login({ onLogin, onAdminLogin }: { onLogin: () => void; onAdminLogin: () => void }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);

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

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-red-500/30">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-red-600/20 rounded-full blur-[120px] mix-blend-screen"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen"
                />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="z-10 w-full max-w-md relative px-4"
            >
                {/* Glass Card */}
                <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden group transform-gpu">
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="flex flex-col items-center relative z-10">
                        {/* Logo Area */}
                        <motion.div
                            className="mb-10 relative"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        >
                            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                            <img src="/logo.png" alt="Bally's" className="h-20 md:h-24 relative z-10 drop-shadow-lg object-contain" />
                        </motion.div>

                        <h2 className="text-xs font-bold tracking-[0.3em] text-white/40 mb-6 uppercase text-center">Authorized Access Only</h2>

                        {/* Mode Toggle */}
                        <div className="w-full mb-6">
                            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 relative">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdminMode(false);
                                        setCode('');
                                        setError(false);
                                    }}
                                    className={`flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-[0.15em] relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${
                                        !isAdminMode ? 'text-white' : 'text-white/40 hover:text-white/60'
                                    }`}
                                >
                                    {!isAdminMode && (
                                        <motion.div
                                            layoutId="activeMode"
                                            className="absolute inset-0 bg-white/10 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                    <User className="w-3.5 h-3.5" />
                                    Frontend
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAdminMode(true);
                                        setCode('');
                                        setError(false);
                                    }}
                                    className={`flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-[0.15em] relative z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${
                                        isAdminMode ? 'text-white' : 'text-white/40 hover:text-white/60'
                                    }`}
                                >
                                    {isAdminMode && (
                                        <motion.div
                                            layoutId="activeMode"
                                            className="absolute inset-0 bg-white/10 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                    <Settings className="w-3.5 h-3.5" />
                                    Admin
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
                                            borderColor: error ? 'rgba(239, 68, 68, 0.5)' : isFocused && i === code.length ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                                            scale: isFocused && i === code.length ? 1.1 : 1,
                                            backgroundColor: code[i] ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                            boxShadow: isFocused && i === code.length ? '0 0 20px rgba(255,255,255,0.1)' : 'none'
                                        }}
                                        className={`w-10 h-12 md:w-12 md:h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-mono transition-colors duration-200 ${code[i] ? 'text-white' : 'text-transparent'}`}
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
                                            className="text-red-400 text-xs tracking-widest font-medium uppercase flex items-center gap-2"
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
                                            className="text-white/20 text-xs tracking-widest uppercase"
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

            <div className="absolute bottom-8 text-white/10 text-[10px] tracking-[0.2em] font-light">
                SECURE ACCESS SYSTEM v2.0
            </div>
        </div>
    );
}
