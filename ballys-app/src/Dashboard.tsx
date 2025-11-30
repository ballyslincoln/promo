import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Phone, Gift, Utensils, Star, Calendar as CalendarIcon, Clock, List, Home, Music, FileText, Edit2, Plus, Keyboard, X } from 'lucide-react';
import { PHONE_NUMBERS } from './data';
import type { Event, AdminEvent, ScheduleItem } from './types';
import { eventService, shouldShowEvent } from './services/eventService';

// Helper to format date
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
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
        <div className="text-[9px] text-text-light tracking-wider uppercase font-mono">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
    );
});

export default function Dashboard({ onAdminOpen, onEditEvent, onAddEvent, previewEvents, previewSchedules }: { onAdminOpen?: () => void, onEditEvent?: (event: Event) => void, onAddEvent?: (date: Date, category?: string) => void, previewEvents?: AdminEvent[], previewSchedules?: Record<string, ScheduleItem[]> }) {
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

    // UI State
    const [activeTab, setActiveTab] = useState<'events' | 'schedules'>('events');
    const [direction, setDirection] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedProperty, setSelectedProperty] = useState<'All' | 'Lincoln' | 'Tiverton'>('All');
    const [showShortcuts, setShowShortcuts] = useState(false);

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

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input (though dashboard usually doesn't have inputs unless admin)
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case 'ArrowLeft':
                    handlePrevDay();
                    break;
                case 'ArrowRight':
                    handleNextDay();
                    break;
                case 't': // Today
                    handleGoToToday();
                    break;
                case '1':
                    if (viewMode === 'list') setActiveTab('events');
                    break;
                case '2':
                    if (viewMode === 'list') setActiveTab('schedules');
                    break;
                case 'c':
                    setViewMode(v => v === 'list' ? 'calendar' : 'list');
                    break;
                case 'p':
                    setSelectedProperty(p => {
                        if (p === 'All') return 'Lincoln';
                        if (p === 'Lincoln') return 'Tiverton';
                        return 'All';
                    });
                    break;
                case '?':
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
            })
            .map(({ startDate, endDate, startTime, endTime, daysOfWeek, isRecurring, ...event }) => event);
    }, [allEventRules, selectedDate, selectedProperty]);

    // Computed phone numbers (dynamic from schedules or fallback) - MEMOIZED
    const phoneNumbers = useMemo(() => {
        return schedules['Important Numbers'] || PHONE_NUMBERS.map(p => ({ name: p.name, time: p.number }));
    }, [schedules]);

    const holiday = useMemo(() => getHoliday(selectedDate), [selectedDate]);

    // Helper for calendar view - MEMOIZED
    const getEventsForDateSync = useMemo(() => (date: Date) => {
        return allEventRules.filter(e => shouldShowEvent(e, date));
    }, [allEventRules]);

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
        <div className="min-h-screen bg-background text-text-main pb-40 font-sans selection:bg-ballys-red/30 relative overflow-x-hidden overscroll-none flex flex-col [contain:layout_style_paint]">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-ballys-red/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-ballys-blue/5 rounded-full blur-[100px]" />
            </div>

            {/* Bottom Fade for smooth edge */}
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-40" />

            {/* Header */}
            <header className="sticky top-0 z-50 pt-6 pb-4 px-4 transition-all duration-300">
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm" />

                <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-5">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between w-full">
                        <div className="w-10" /> {/* Spacer */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-3">
                                <img src="/logo.png" alt="Logo" className="h-8 object-contain drop-shadow-sm" />
                                <div className="h-4 w-[1px] bg-gray-300" />
                                <span className="text-[10px] tracking-[0.4em] uppercase font-semibold text-text-muted">Day At A Glance</span>
                            </div>
                            <ClockHeader />
                        </div>
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-colors [transform:translateZ(0)]"
                            title={viewMode === 'list' ? 'Switch to Calendar View (C)' : 'Switch to List View (C)'}
                        >
                            {viewMode === 'list' ? <CalendarIcon className="w-4 h-4 text-text-muted" /> : <List className="w-4 h-4 text-text-muted" />}
                        </button>
                        <button
                            onClick={() => setShowShortcuts(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-colors [transform:translateZ(0)] ml-2"
                            title="Keyboard Shortcuts (?)"
                        >
                            <Keyboard className="w-4 h-4 text-text-muted" />
                        </button>
                    </div>

                    {/* Property Toggle */}
                    <div className="flex bg-white/40 backdrop-blur-md rounded-full border border-white/50 p-1.5 relative shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
                        {['All', 'Lincoln', 'Tiverton'].map((prop) => (
                            <button
                                key={prop}
                                onClick={() => setSelectedProperty(prop as any)}
                                className={`relative z-10 px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
                                    selectedProperty === prop 
                                    ? 'text-white' 
                                    : 'text-gray-500 hover:text-gray-800'
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
                                    {prop === 'All' ? 'All Properties' : prop}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Admin Button - MOVED TO FOOTER */}
                    {/* {onAdminOpen && (
                        <button
                            onClick={onAdminOpen}
                            className="absolute top-2 left-2 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-text-muted uppercase tracking-wider shadow-sm transition-colors flex items-center gap-2 z-50"
                        >
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Admin Panel
                        </button>
                    )} */}

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
                                <div className="flex items-center justify-between bg-white rounded-full p-1.5 border border-gray-200 shadow-sm backdrop-blur-md">
                                    <button
                                        onClick={handlePrevDay}
                                        className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-95 group"
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
                                        className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-95 group"
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
                                className="w-full max-w-md mb-4 text-center"
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                                    <span className="text-xl filter drop-shadow-sm">{holiday.emoji}</span>
                                    <span className="text-sm font-bold uppercase tracking-wider text-ballys-red">{holiday.name}</span>
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
                                className="flex p-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 w-full max-w-md relative shadow-sm overflow-hidden"
                            >
                                {['events', 'schedules'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-[0.2em] relative z-10 transition-colors duration-300 ${
                                            activeTab === tab 
                                            ? 'text-ballys-red' 
                                            : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100"
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

            <main className="max-w-3xl mx-auto px-4 py-8 relative z-10 flex-1 w-full [contain:layout_style_paint]">
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
                            <CalendarView
                                selectedDate={selectedDate}
                                getEvents={getEventsForDateSync}
                                onSelectDate={(date) => {
                                    setSelectedDate(date);
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
                                    className="space-y-10"
                                >
                                    {/* Invited Guest Events */}
                                    <Section 
                                        title="Invited Guest Events" 
                                        icon={<Star className="w-4 h-4 text-ballys-gold" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Invited') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Invited').map((event) => (
                                                <EventCard key={event.id} event={event} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Invited').length === 0 && (
                                            <EmptyState message="No invited guest events scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Invited') : undefined} />
                                        )}
                                    </Section>

                                    {/* Open To All */}
                                    <Section 
                                        title="Open To All Guests" 
                                        icon={<Gift className="w-4 h-4 text-ballys-red" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Open') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Open').map((event) => (
                                                <EventCard key={event.id} event={event} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Open').length === 0 && (
                                            <EmptyState message="No open events scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Open') : undefined} />
                                        )}
                                    </Section>

                                    {/* Dining Offers */}
                                    <Section 
                                        title="Dining & Happy Hours" 
                                        icon={<Utensils className="w-4 h-4 text-ballys-blue" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Dining') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Dining').map((event) => (
                                                <EventCard key={event.id} event={event} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Dining').length === 0 && (
                                            <EmptyState message="No dining specials scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Dining') : undefined} />
                                        )}
                                    </Section>

                                    {/* Promo Events */}
                                    <Section 
                                        title="Promotions" 
                                        icon={<Gift className="w-4 h-4 text-purple-500" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Promo') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Promo').map((event) => (
                                                <EventCard key={event.id} event={event} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Promo').length === 0 && (
                                            <EmptyState message="No promotions scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Promo') : undefined} />
                                        )}
                                    </Section>

                                    {/* Entertainment */}
                                    <Section 
                                        title="Entertainment" 
                                        icon={<Music className="w-4 h-4 text-pink-500" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Entertainment') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Entertainment').map((event) => (
                                                <EventCard key={event.id} event={event} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Entertainment').length === 0 && (
                                            <EmptyState message="No entertainment scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Entertainment') : undefined} />
                                        )}
                                    </Section>

                                    {/* Important Numbers (Internal) */}
                                    <div className="glass-card rounded-2xl overflow-hidden mt-8">
                                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-text-light" />
                                            <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em]">Important Numbers</h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {phoneNumbers.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white hover:bg-gray-50 p-3.5 rounded-xl border border-gray-100 transition-all group cursor-pointer hover:border-gray-200 shadow-sm">
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
                                                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-text-light" />
                                                    <h3 className="text-xs font-bold text-text-main uppercase tracking-[0.2em]">{category}</h3>
                                                </div>
                                                <div className="p-2">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                                                            <span className="font-medium text-sm text-text-main">{item.name}</span>
                                                            <span className="text-xs font-mono text-text-muted bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{item.time}</span>
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
            <footer className="relative z-50 py-8 px-4 border-t border-gray-200/50 mt-auto bg-white/50 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto text-center space-y-3">
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">
                        Created by Regional Advertising Manager Jackson Kelly
                    </p>
                    <p className="text-[10px] text-text-light uppercase tracking-widest">
                        &copy; Bally's Corporation {new Date().getFullYear()} All Rights Reserved
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3 text-[9px] text-text-light/70 font-mono uppercase tracking-wider">
                        <span>v8.1</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>Created in Lincoln, RI</span>
                    </div>
                    {onAdminOpen && (
                        <button
                            onClick={onAdminOpen}
                            className="mt-4 px-3 py-1 bg-gray-100/50 hover:bg-gray-100 border border-gray-200/50 rounded-full text-[9px] font-bold text-text-light hover:text-text-muted uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                            Admin Access
                        </button>
                    )}
                </div>
            </footer>

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
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden border border-white/50"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                            <Keyboard className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Keyboard Shortcuts</h3>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Power User Controls</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowShortcuts(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
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
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100/50 hover:border-gray-200 transition-colors group">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{item.description}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {item.keys.map((key, kIdx) => (
                                                    <kbd key={kIdx} className="min-w-[24px] h-6 px-1.5 flex items-center justify-center bg-white rounded-md border border-gray-200 text-xs font-mono font-bold text-gray-600 shadow-sm group-hover:border-gray-300 group-hover:shadow transition-all">
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400 font-medium">Press <kbd className="font-mono bg-white border border-gray-200 rounded px-1 mx-0.5">Esc</kbd> to close</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CalendarView({ selectedDate, onSelectDate, getEvents }: { selectedDate: Date, onSelectDate: (date: Date) => void, getEvents: (date: Date) => any[] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const prevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    return (
        <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-8">
                <button onClick={prevMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-lg font-bold text-gray-800 tracking-widest uppercase">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((date, idx) => {
                    if (!date) return <div key={idx} />;
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayEvents = getEvents(date);
                    const hasTiverton = dayEvents.some(e => !e.property || e.property === 'Tiverton' || e.property === 'Both');
                    const hasLincoln = dayEvents.some(e => !e.property || e.property === 'Lincoln' || e.property === 'Both');

                    return (
                        <button
                            key={idx}
                            onClick={() => onSelectDate(date)}
                            className={`
                                relative h-14 rounded-xl flex flex-col items-center justify-start pt-2 transition-all duration-200
                                ${isSelected 
                                    ? 'bg-gradient-to-br from-ballys-red to-ballys-darkRed text-white shadow-lg scale-105' 
                                    : 'bg-white/40 hover:bg-white/80 text-gray-500 hover:text-gray-900'}
                                ${isToday && !isSelected ? 'border border-ballys-red/50 ring-1 ring-ballys-red/20' : ''}
                            `}
                        >
                            <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>{date.getDate()}</span>
                            <div className="flex gap-1 mt-1.5">
                                {hasLincoln && (
                                    <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isSelected ? 'bg-white' : 'bg-ballys-red'}`} title="Lincoln Event" />
                                )}
                                {hasTiverton && (
                                    <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${isSelected ? 'bg-white/80' : 'bg-green-500'}`} title="Tiverton Event" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Section({ title, icon, children, onAddEvent }: { title: string, icon: React.ReactNode, children: React.ReactNode, onAddEvent?: () => void }) {
    return (
        <div className="mb-10">
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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-gray-300/50 rounded-2xl bg-white/30 backdrop-blur-sm group hover:bg-white/50 transition-colors cursor-pointer" onClick={onAddEvent}>
            <CalendarIcon className="w-8 h-8 text-gray-400 mb-3 group-hover:text-gray-600 transition-colors" />
            <p className="text-gray-500 text-sm italic mb-2">{message}</p>
            {onAddEvent && (
                <span className="text-xs text-ballys-red/70 font-bold uppercase tracking-wider group-hover:text-ballys-red transition-colors">
                    Click to add event
                </span>
            )}
        </div>
    );
}

function EventCard({ event, onEdit }: { event: Event, onEdit?: (event: Event) => void }) {
    return (
        <div
            className={`glass-card relative overflow-hidden rounded-2xl border transition-all duration-200 group transform-gpu [backface-visibility:hidden] [will-change:transform] ${event.highlight
                ? 'bg-gradient-to-br from-ballys-gold/10 to-white/80 border-ballys-gold/30 shadow-lg'
                : 'hover:bg-white/80 hover:border-ballys-red/20'
                }`}
        >
            {onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(event);
                    }}
                    className="absolute top-3 right-3 z-20 p-2 bg-white hover:bg-ballys-red text-gray-400 hover:text-white rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 border border-gray-100"
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
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                        {event.property && event.property !== 'Both' && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block ${
                                event.property === 'Lincoln' ? 'bg-ballys-red/10 text-ballys-red' : 'bg-green-500/10 text-green-600'
                            }`}>
                                {event.property === 'Lincoln' ? "Bally's Lincoln" : "Bally's Tiverton"}
                            </span>
                        )}
                        <h4 className={`text-lg font-bold leading-tight ${event.highlight ? 'text-yellow-700' : 'text-gray-900'}`}>
                            {event.title}
                        </h4>
                    </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-5 font-normal">
                    {event.description}
                </p>

                {event.media && event.media.length > 0 && (
                    <div className="mb-5 grid grid-cols-2 gap-2">
                        {event.media.map((item, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group/media">
                                {item.type === 'image' ? (
                                    <div className="aspect-video relative cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                                        <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110" />
                                        <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/media:opacity-100">
                                            <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/50 px-2 py-1 rounded backdrop-blur-md">View</span>
                                        </div>
                                    </div>
                                ) : (
                                    <a href={item.url} download={item.name} className="flex flex-col items-center justify-center p-4 gap-2 hover:bg-gray-100 transition-colors aspect-video text-center">
                                        <FileText className="w-8 h-8 text-gray-400 group-hover/media:text-gray-600 transition-colors" />
                                        <span className="text-xs text-gray-500 group-hover/media:text-gray-700 truncate w-full px-2">{item.name}</span>
                                        <span className="text-[9px] uppercase tracking-wider text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded">PDF</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {event.details && (
                    <ul className="space-y-2.5 mb-5">
                        {event.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-xs text-gray-600">
                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${event.highlight ? 'bg-ballys-gold' : 'bg-ballys-red'}`} />
                                <span className="leading-relaxed">{detail}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {event.meta && (
                    <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100/50">
                        {event.meta.map((meta, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-200/50 group-hover:border-gray-300/50 transition-colors">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{meta.label}</span>
                                <span className="text-xs text-gray-700 font-medium">{meta.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
