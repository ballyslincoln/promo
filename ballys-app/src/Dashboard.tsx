import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Phone, Gift, Utensils, Star, Calendar as CalendarIcon, Clock, List, Home, Music, FileText, Edit2, Plus, Keyboard, X, Zap, MessageSquare, Users } from 'lucide-react';
import { PHONE_NUMBERS } from './data';
import type { Event, AdminEvent, ScheduleItem } from './types';
import { eventService, shouldShowEvent } from './services/eventService';
import { interactionService } from './services/interactionService';
import { analyticsService } from './services/analyticsService';
import BigCalendar from './components/Calendar/BigCalendar';
import EventDetailsModal from './components/EventDetailsModal';
import { ThemeToggle } from './components/ThemeToggle';
import Footer from './components/Footer';

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getHoliday = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const key = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    const holidays: Record<string, { name: string, emoji: string }> = {
        '01-01': { name: "Happy New Year!", emoji: "🎉" },
        '02-14': { name: "Happy Valentine's Day!", emoji: "❤️" },
        '03-17': { name: "Happy St. Patrick's Day!", emoji: "☘️" },
        '07-04': { name: "Happy 4th of July!", emoji: "🇺🇸" },
        '10-31': { name: "Happy Halloween!", emoji: "🎃" },
        '11-27': { name: "Happy Thanksgiving!", emoji: "🦃" }, // 2025 specific
        '12-25': { name: "Merry Christmas!", emoji: "🎄" },
        '12-31': { name: "Happy New Year's Eve!", emoji: "🥂" },
    };

    return holidays[key];
};

const SnowEffect = memo(() => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
            {[...Array(40)].map((_, i) => (
                <div
                    key={i}
                    className="absolute bg-white rounded-full animate-snow"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-${Math.random() * 20}px`,
                        width: `${Math.random() * 3 + 2}px`,
                        height: `${Math.random() * 3 + 2}px`,
                        opacity: Math.random() * 0.5 + 0.3,
                        animationDuration: `${Math.random() * 5 + 5}s`,
                        animationDelay: `${Math.random() * 5}s`,
                    }}
                />
            ))}
        </div>
    );
});

const ClockHeader = memo(() => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-[9px] text-text-light tracking-wider uppercase font-mono whitespace-nowrap">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
    );
});

export default function Dashboard({ onAdminOpen, onPrivacyClick, onEditEvent, onAddEvent, previewEvents, previewSchedules }: { onAdminOpen?: () => void, onPrivacyClick?: () => void, onEditEvent?: (event: Event) => void, onAddEvent?: (date: Date, category?: string) => void, previewEvents?: AdminEvent[], previewSchedules?: Record<string, ScheduleItem[]> }) {
    // Default to today's date
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        // Set to noon to avoid timezone issues
        today.setHours(12, 0, 0, 0);
        return today;
    });

    // Data state
    const [allEventRules, setAllEventRules] = useState<AdminEvent[]>([]);
    const [schedules, setSchedules] = useState<Record<string, ScheduleItem[]>>({});
    const [stats, setStats] = useState<Record<string, { aura: number, reactions: number }>>({});

    // UI State
    const [activeTab, setActiveTab] = useState<'events' | 'schedules'>('events');
    const [direction, setDirection] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedProperty, setSelectedProperty] = useState<'All' | 'Lincoln' | 'Tiverton'>('All');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeUsers, setActiveUsers] = useState(1);

    // Active User Tracking
    useEffect(() => {
        const heartbeat = async () => {
            const { total } = await analyticsService.sendHeartbeat();
            if (total) setActiveUsers(total);
        };
        
        heartbeat();
        const interval = setInterval(heartbeat, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load initial data
    const loadData = async () => {
        if (previewEvents) {
            setAllEventRules(previewEvents);
        } else {
            const rules = await eventService.getEvents();
            setAllEventRules(rules);
        }

        if (previewSchedules) {
            setSchedules(previewSchedules);
        } else {
            const sched = await eventService.getSchedules();
            setSchedules(sched);
        }
    };

    // Update when preview props change or component mounts
    useEffect(() => {
        loadData();
    }, [previewEvents, previewSchedules]);

    // Fetch stats for visible events
    useEffect(() => {
        const fetchStats = async () => {
            const visibleEvents = allEventRules.filter(e => shouldShowEvent(e, selectedDate));
            if (visibleEvents.length > 0) {
                const ids = visibleEvents.map(e => e.id);
                const newStats = await interactionService.getStatsForEvents(ids);
                setStats(prev => ({ ...prev, ...newStats }));
            }
        };

        if (viewMode === 'list' && activeTab === 'events' && allEventRules.length > 0) {
            fetchStats();
        }
    }, [selectedDate, allEventRules, viewMode, activeTab]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input (though dashboard usually doesn't have inputs unless admin)
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault(); // Prevent scrolling
                    handlePrevDay();
                    break;
                case 'ArrowRight':
                    e.preventDefault(); // Prevent scrolling
                    handleNextDay();
                    break;
                case 't': // Today
                case 'T':
                    handleGoToToday();
                    break;
                case '1':
                    if (viewMode === 'list') setActiveTab('events');
                    break;
                case '2':
                    if (viewMode === 'list') setActiveTab('schedules');
                    break;
                case 'c':
                case 'C':
                    setViewMode(v => v === 'list' ? 'calendar' : 'list');
                    break;
                case 'p':
                case 'P':
                    setSelectedProperty(p => {
                        if (p === 'All') return 'Lincoln';
                        if (p === 'Lincoln') return 'Tiverton';
                        return 'All';
                    });
                    break;
                case '?':
                case '/': // Allow slash as well for easier access
                    setShowShortcuts(s => !s);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDate, viewMode]);

    // Listen for storage changes (only if not in preview mode)
    useEffect(() => {
        if (previewEvents || previewSchedules) return;

        const handleStorageChange = () => {
            loadData();
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('ballys_events_updated', handleStorageChange);
        window.addEventListener('ballys_schedules_updated', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('ballys_events_updated', handleStorageChange);
            window.removeEventListener('ballys_schedules_updated', handleStorageChange);
        };
    }, [previewEvents, previewSchedules]);

    // Computed events for current view - MEMOIZED to prevent stutter
    const events = useMemo(() => {
        return allEventRules
            .filter(e => {
                // Date filter
                const dateMatch = shouldShowEvent(e, selectedDate);
                if (!dateMatch) return false;

                // Property filter
                if (selectedProperty === 'All') return true;
                // Show if property matches OR if property is 'Both' (or undefined which defaults to Both)
                const prop = e.property || 'Both';
                return prop === 'Both' || prop === selectedProperty;
            });
    }, [allEventRules, selectedDate, selectedProperty]);

    // Computed events for calendar view - filtered by property but NOT date
    const calendarFilteredEvents = useMemo(() => {
        return allEventRules.filter(e => {
            // Property filter
            if (selectedProperty === 'All') return true;
            const prop = e.property || 'Both';
            return prop === 'Both' || prop === selectedProperty;
        });
    }, [allEventRules, selectedProperty]);

    // Computed phone numbers (dynamic from schedules or fallback) - MEMOIZED
    const phoneNumbers = useMemo(() => {
        return schedules['Important Numbers'] || PHONE_NUMBERS.map(p => ({ name: p.name, time: p.number }));
    }, [schedules]);

    const holiday = useMemo(() => getHoliday(selectedDate), [selectedDate]);

    const handlePrevDay = () => {
        setDirection(-1);
        setSelectedDate(d => addDays(d, -1));
    };
    const handleNextDay = () => {
        setDirection(1);
        setSelectedDate(d => addDays(d, 1));
    };

    const handleGoToToday = () => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const todayStr = today.toISOString();
        const selectedStr = selectedDate.toISOString();

        if (todayStr !== selectedStr) {
            setDirection(today > selectedDate ? 1 : -1);
            setSelectedDate(today);
        }
    };

    const handleHomeClick = () => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        
        setSelectedDate(today);
        setViewMode('list');
        setActiveTab('events');
        setDirection(0);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 20 : -20,
            opacity: 0
        })
    };

    return (
        <div className="min-h-screen bg-background text-text-main pb-40 font-sans selection:bg-ballys-red/30 relative overflow-x-hidden overscroll-none flex flex-col transition-colors duration-300">
            {/* Ambient Background - Optimized for performance */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-ballys-red/5 rounded-full blur-3xl opacity-50 transform-gpu will-change-transform" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-ballys-blue/5 rounded-full blur-3xl opacity-50 transform-gpu will-change-transform" />
            </div>

            {/* Bottom Fade for smooth edge */}
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent pointer-events-none z-40" />

            {/* Header */}
            <header className="sticky top-0 z-50 pt-safe-top transition-all duration-300">
                <div className="absolute inset-0 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm" />

                <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-4 px-4 py-4">
                    {/* Top Bar */}
                    <div className="w-full relative flex items-center justify-between min-h-[40px]">

                        {/* Logo & Title Area */}
                        <div 
                            className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 cursor-pointer group"
                            onClick={handleHomeClick}
                            title="Go to Today"
                        >
                            <div className="relative group-hover:scale-105 transition-transform duration-200">
                                <img src="/logo.png" alt="Logo" className="h-5 md:h-8 object-contain drop-shadow-sm shrink-0" />
                                <span className="absolute -top-2 -right-3 bg-ballys-gold text-[8px] font-bold px-1.5 py-0.5 rounded text-black uppercase tracking-wider border border-white/20 shadow-sm rotate-12">Beta</span>
                            </div>
                            <div className="h-3 md:h-4 w-[1px] bg-border shrink-0" />
                            <div className="flex flex-col justify-center overflow-hidden">
                                <span className="text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] uppercase font-semibold text-text-muted truncate group-hover:text-text-main transition-colors">Day At A Glance</span>
                                <ClockHeader />
                            </div>
                        </div>

                        {/* Right Aligned Controls */}
                        <div className="flex items-center justify-end gap-1.5 md:gap-2 shrink-0 ml-2">
                            
                            {/* Live Users Indicator */}
                            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-surface border border-border rounded-lg shadow-sm mr-1 md:mr-2" title="Active Users">
                                <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500"></span>
                                </span>
                                <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-text-muted" />
                                <span className="text-[10px] md:text-xs font-bold text-text-main">{activeUsers}</span>
                            </div>

                            <div className="scale-90 md:scale-100 origin-right">
                                <ThemeToggle />
                            </div>
                            <button
                                onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border shadow-sm transition-colors [transform:translateZ(0)] active:scale-95"
                                title={viewMode === 'list' ? 'Switch to Calendar View (C)' : 'Switch to List View (C)'}
                            >
                                {viewMode === 'list' ? <CalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-muted" /> : <List className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-muted" />}
                            </button>
                            <button
                                onClick={() => setShowShortcuts(true)}
                                className="hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border shadow-sm transition-colors [transform:translateZ(0)]"
                                title="Keyboard Shortcuts (?)"
                            >
                                <Keyboard className="w-4 h-4 text-text-muted" />
                            </button>
                        </div>
                    </div>

                    {/* Property Toggle - Scrollable container for small screens */}
                    <div className="w-full overflow-x-auto no-scrollbar flex justify-center">
                        <div className="flex bg-surface/40 backdrop-blur-md rounded-full border border-border p-1 relative shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] whitespace-nowrap">
                            {['All', 'Lincoln', 'Tiverton'].map((prop) => (
                                <button
                                    key={prop}
                                    onClick={() => setSelectedProperty(prop as any)}
                                    className={`relative z-10 px-4 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors duration-300 rounded-full ${selectedProperty === prop
                                        ? 'text-white'
                                        : 'text-text-muted hover:text-text-main'
                                        }`}
                                >
                                    {selectedProperty === prop && (
                                        <motion.div
                                            layoutId="activeProperty"
                                            className="absolute inset-0 bg-gradient-to-r from-ballys-red to-ballys-darkRed rounded-full shadow-lg shadow-ballys-red/30"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                            style={{ willChange: 'transform' }}
                                        />
                                    )}
                                    <span className="relative z-20 drop-shadow-sm">
                                        {prop === 'All' ? 'All Props' : prop}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Navigator (Only in List Mode) */}
                    <AnimatePresence mode="wait" initial={false}>
                        {viewMode === 'list' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="flex flex-col gap-3 w-full max-w-md"
                            >
                                <div className="flex items-center justify-between bg-surface rounded-full p-1 border border-border shadow-sm backdrop-blur-md">
                                    <button
                                        onClick={handlePrevDay}
                                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95 group"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-text-muted group-hover:text-text-main transition-colors" />
                                    </button>

                                    <div className="flex-1 text-center overflow-hidden h-6 relative">
                                        <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                            <motion.div
                                                key={selectedDate.toISOString()}
                                                custom={direction}
                                                variants={variants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <h2 className="text-sm font-semibold tracking-widest text-text-main whitespace-nowrap uppercase">
                                                    {formatDate(selectedDate)}
                                                </h2>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        onClick={handleNextDay}
                                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95 group"
                                    >
                                        <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-main transition-colors" />
                                    </button>
                                </div>

                                {/* Take me to today button - only show if not on today */}
                                {(() => {
                                    const today = new Date();
                                    today.setHours(12, 0, 0, 0);
                                    const isToday = today.toISOString() === selectedDate.toISOString();

                                    if (isToday) return null;

                                    return (
                                        <button
                                            onClick={handleGoToToday}
                                            className="w-full px-4 py-2.5 bg-ballys-red/10 hover:bg-ballys-red/20 border border-ballys-red/20 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 group text-ballys-red"
                                        >
                                            <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                            Take Me To Today
                                        </button>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Holiday Greeting */}
                    <AnimatePresence>
                        {holiday && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full max-w-md mb-1 text-center"
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full shadow-sm">
                                    <span className="text-xl filter drop-shadow-sm">{holiday.emoji}</span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-ballys-red">{holiday.name}</span>
                                    <span className="text-xl filter drop-shadow-sm">{holiday.emoji}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Snow Effect for Christmas */}
                    {holiday?.name === "Merry Christmas!" && <SnowEffect />}

                    {/* Tabs (Only in List Mode) */}
                    <AnimatePresence initial={false}>
                        {viewMode === 'list' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="flex p-1 bg-surface/40 backdrop-blur-md rounded-2xl border border-surface/50 w-full max-w-md relative shadow-sm overflow-hidden"
                            >
                                {['events', 'schedules'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`flex-1 py-2.5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] relative z-10 transition-colors duration-300 ${activeTab === tab
                                            ? 'text-ballys-red'
                                            : 'text-text-muted hover:text-text-main'
                                            }`}
                                    >
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-surface rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                                                style={{ willChange: 'transform' }}
                                            />
                                        )}
                                        <span className="relative z-20">{tab}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6 relative z-10 flex-1 w-full [contain:layout_style_paint]">
                <AnimatePresence mode="wait" initial={false}>
                    {viewMode === 'calendar' ? (
                        <motion.div
                            key="calendar-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="w-full"
                            style={{ willChange: 'opacity' }}
                        >
                            <BigCalendar
                                events={calendarFilteredEvents}
                                onSelectEvent={(event) => {
                                    setSelectedEvent(event);
                                    setIsModalOpen(true);
                                }}
                                onSelectSlot={({ start }) => {
                                    setSelectedDate(start);
                                    setViewMode('list');
                                }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="w-full"
                            style={{ willChange: 'opacity' }}
                        >
                            {activeTab === 'events' && (
                                <div
                                    key={`events-${selectedDate.toISOString()}`}
                                    className="space-y-8"
                                >
                                    {/* Dynamic Sections */}
                                    {(() => {
                                        const sections = [
                                            { id: 'Invited', title: 'Invited Guest Events', icon: <Star className="w-4 h-4 text-ballys-gold" />, events: events.filter(e => e.category === 'Invited') },
                                            { id: 'Open', title: 'Open To All Guests', icon: <Gift className="w-4 h-4 text-ballys-red" />, events: events.filter(e => e.category === 'Open') },
                                            { id: 'Dining', title: 'Dining & Happy Hours', icon: <Utensils className="w-4 h-4 text-ballys-blue" />, events: events.filter(e => e.category === 'Dining') },
                                            { id: 'Promo', title: 'Promotions', icon: <Gift className="w-4 h-4 text-purple-500" />, events: events.filter(e => e.category === 'Promo') },
                                            { id: 'Entertainment', title: 'Entertainment', icon: <Music className="w-4 h-4 text-pink-500" />, events: events.filter(e => e.category === 'Entertainment') }
                                        ];

                                        // Sort sections: 
                                        // If 'Open' has no events, move it to the end (before important numbers)
                                        const sortedSections = [...sections].sort((a, b) => {
                                            if (a.id === 'Open' && a.events.length === 0) return 1;
                                            if (b.id === 'Open' && b.events.length === 0) return -1;
                                            return 0; // Keep original order otherwise
                                        });

                                        return sortedSections.map(section => {
                                            // Hide Dining if empty
                                            if (section.id === 'Dining' && section.events.length === 0 && !onAddEvent) {
                                                return null;
                                            }

                                            return (
                                            <Section
                                                key={section.id}
                                                title={section.title}
                                                icon={section.icon}
                                                onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, section.id) : undefined}
                                            >
                                                <div className="space-y-4">
                                                    {section.events.map((event) => (
                                                        <EventCard
                                                            key={event.id}
                                                            event={event}
                                                            stats={stats[event.id]}
                                                            onEdit={onEditEvent}
                                                            onClick={(e) => {
                                                                const eventWithDate = {
                                                                    ...e,
                                                                    startDate: selectedDate.toISOString().split('T')[0]
                                                                };
                                                                setSelectedEvent(eventWithDate);
                                                                setIsModalOpen(true);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                {section.events.length === 0 && (
                                                    <EmptyState 
                                                        message={`No ${section.title.toLowerCase()} scheduled.`} 
                                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, section.id) : undefined} 
                                                    />
                                                )}
                                            </Section>
                                        )});
                                    })()}

                                    {/* Important Numbers (Internal) */}
                                    <div className="glass-card rounded-2xl overflow-hidden mt-8">
                                        <div className="bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 border-b border-border flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-text-light" />
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em]">Important Numbers</h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {phoneNumbers.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 p-3.5 rounded-xl border border-border transition-all group cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 shadow-sm">
                                                    <span className="text-sm font-medium text-text-main">{item.name}</span>
                                                    <span className="text-xs font-mono text-ballys-red/80 group-hover:text-ballys-red bg-ballys-red/5 px-2 py-1 rounded">{item.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'schedules' && (
                                <div
                                    key="schedules"
                                    className="space-y-6"
                                >
                                    {Object.entries(schedules)
                                        .filter(([category]) => category !== 'Important Numbers')
                                        .map(([category, items]) => (
                                            <div
                                                key={category}
                                                className="glass-card rounded-2xl overflow-hidden"
                                            >
                                                <div className="bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 border-b border-border flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-text-light" />
                                                    <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em]">{category}</h3>
                                                </div>
                                                <div className="p-2">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors group">
                                                            <span className="font-medium text-sm text-text-main">{item.name}</span>
                                                            <span className="text-xs font-mono text-text-muted bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border border-border">{item.time}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <Footer onAdminOpen={onAdminOpen} onPrivacyClick={onPrivacyClick} />

            {/* Keyboard Shortcuts Modal */}
            <AnimatePresence>
                {showShortcuts && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                            onClick={() => setShowShortcuts(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-surface rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden border border-border"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center border border-border">
                                            <Keyboard className="w-5 h-5 text-text-muted" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-text-main">Keyboard Shortcuts</h3>
                                            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Power User Controls</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowShortcuts(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-text-muted" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { keys: ['←', '→'], label: 'Navigate Days', description: 'Previous / Next Day' },
                                        { keys: ['T'], label: 'Today', description: 'Jump to Current Date' },
                                        { keys: ['1'], label: 'Events Tab', description: 'View Daily Events' },
                                        { keys: ['2'], label: 'Schedules Tab', description: 'View Hours of Operation' },
                                        { keys: ['C'], label: 'Change View', description: 'Toggle List / Calendar' },
                                        { keys: ['P'], label: 'Property', description: 'Toggle Lincoln / Tiverton' },
                                        { keys: ['?'], label: 'Help', description: 'Show this menu' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-border hover:border-gray-300 dark:hover:border-gray-600 transition-colors group">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-text-main">{item.label}</span>
                                                <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{item.description}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {item.keys.map((key, kIdx) => (
                                                    <kbd key={kIdx} className="min-w-[24px] h-6 px-1.5 flex items-center justify-center bg-surface rounded-md border border-border text-xs font-mono font-bold text-text-main shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-500 transition-all">
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800 px-6 py-4 border-t border-border text-center">
                                <p className="text-[10px] text-text-muted font-medium">Press <kbd className="font-mono bg-surface border border-border rounded px-1 mx-0.5">Esc</kbd> to close</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <EventDetailsModal
                event={selectedEvent}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onEdit={onEditEvent}
            />
        </div>
    );
}

function Section({ title, icon, children, onAddEvent }: { title: string, icon: React.ReactNode, children: React.ReactNode, onAddEvent?: () => void }) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-5 px-2 opacity-70">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">{title}</h3>
                </div>
                {onAddEvent && (
                    <button
                        onClick={onAddEvent}
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-ballys-red hover:text-ballys-darkRed transition-colors"
                    >
                        <Plus className="w-3 h-3" /> Add Event
                    </button>
                )}
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

function EmptyState({ message, onAddEvent }: { message: string, onAddEvent?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-2xl bg-surface/30 backdrop-blur-sm group hover:bg-surface/50 transition-colors cursor-pointer" onClick={onAddEvent}>
            <CalendarIcon className="w-8 h-8 text-text-muted mb-3 group-hover:text-text-main transition-colors" />
            <p className="text-text-muted text-sm italic mb-2">{message}</p>
            {onAddEvent && (
                <span className="text-xs text-ballys-red/70 font-bold uppercase tracking-wider group-hover:text-ballys-red transition-colors">
                    Click to add event
                </span>
            )}
        </div>
    );
}

function EventCard({ event, stats, onEdit, onClick }: { event: Event, stats?: { aura: number, reactions: number }, onEdit?: (event: Event) => void, onClick?: (event: Event) => void }) {
    return (
        <div
            onClick={() => onClick && onClick(event)}
            className={`glass-card relative overflow-hidden rounded-2xl border transition-all duration-200 group transform-gpu [backface-visibility:hidden] [will-change:transform] cursor-pointer ${event.highlight
                ? 'bg-gradient-to-br from-ballys-gold/10 to-surface/80 border-ballys-gold/30 shadow-lg'
                : 'hover:bg-surface/80 hover:border-ballys-red/20'
                }`}
        >
            {onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(event);
                    }}
                    className="absolute top-3 right-3 z-20 p-2 bg-surface hover:bg-ballys-red text-text-light hover:text-white rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 border border-border"
                    title="Edit Event"
                >
                    <Edit2 className="w-3 h-3" />
                </button>
            )}
            {event.highlight && (
                <div className="absolute top-0 right-0 bg-ballys-gold text-black text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-bl-xl z-10 shadow-sm">
                    Featured
                </div>
            )}

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 dark:via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                        {event.property && event.property !== 'Both' && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block ${event.property === 'Lincoln' ? 'bg-ballys-red/10 text-ballys-red' : 'bg-green-500/10 text-green-600'
                                }`}>
                                {event.property === 'Lincoln' ? "Bally's Lincoln" : "Bally's Tiverton"}
                            </span>
                        )}
                        <h4 className={`text-lg font-bold leading-tight ${event.highlight ? 'text-yellow-700 dark:text-yellow-500' : 'text-text-main'}`}>
                            {event.title}
                        </h4>
                    </div>
                </div>

                <p className="text-text-muted text-sm leading-relaxed mb-5 font-normal">
                    {event.description}
                </p>

                {event.media && event.media.length > 0 && (
                    <div className="mb-5 grid grid-cols-2 gap-2">
                        {event.media.map((item, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-border bg-gray-50 dark:bg-slate-800 group/media">
                                {item.type === 'image' ? (
                                    <div className="aspect-video relative cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}>
                                        <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110" />
                                        <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/media:opacity-100">
                                            <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/50 px-2 py-1 rounded backdrop-blur-md">View</span>
                                        </div>
                                    </div>
                                ) : (
                                    <a href={item.url} download={item.name} onClick={(e) => e.stopPropagation()} className="flex flex-col items-center justify-center p-4 gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors aspect-video text-center">
                                        <FileText className="w-8 h-8 text-text-light group-hover/media:text-text-main transition-colors" />
                                        <span className="text-xs text-text-muted group-hover/media:text-text-main truncate w-full px-2">{item.name}</span>
                                        <span className="text-[9px] uppercase tracking-wider text-text-light bg-surface border border-border px-2 py-0.5 rounded">PDF</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {event.details && (
                    <ul className="space-y-2.5 mb-5">
                        {event.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-xs text-text-muted">
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${event.highlight ? 'bg-ballys-gold' : 'bg-ballys-red'}`} />
                                <span className="leading-relaxed">{detail}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex items-center justify-between mt-5 pt-5 border-t border-border">
                    {event.meta ? (
                        <div className="flex flex-wrap gap-2">
                            {event.meta.map((meta, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-surface/50 px-3 py-1.5 rounded-lg border border-border group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors">
                                    <span className="text-[9px] font-bold text-text-light uppercase tracking-wider">{meta.label}</span>
                                    <span className="text-xs text-text-main font-medium">{meta.value}</span>
                                </div>
                            ))}
                        </div>
                    ) : <div />}

                    {/* Stats Preview */}
                    <div className="flex items-center gap-3 ml-auto pl-2">
                        {stats && (stats.aura > 0 || stats.reactions > 0) && (
                            <>
                                {stats.aura > 0 && (
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <Zap className="w-3.5 h-3.5 fill-current" />
                                        <span className="text-xs font-bold">{stats.aura}</span>
                                    </div>
                                )}
                                {stats.reactions > 0 && (
                                    <div className="flex items-center gap-1 text-text-muted">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">{stats.reactions}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
