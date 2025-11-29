import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Phone, Info, Gift, Utensils, Star, Calendar as CalendarIcon, Clock, List, Home, Music, FileText, Edit2, Plus } from 'lucide-react';
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

const SnowEffect = () => {
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
};

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
    const [activeTab, setActiveTab] = useState<'events' | 'schedules' | 'internal'>('events');
    const [direction, setDirection] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedProperty, setSelectedProperty] = useState<'All' | 'Lincoln' | 'Tiverton'>('All');

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
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

    // Computed events for current view
    const events = allEventRules
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

    // Computed phone numbers (dynamic from schedules or fallback)
    const phoneNumbers = schedules['Important Numbers'] || PHONE_NUMBERS.map(p => ({ name: p.name, time: p.number }));

    const holiday = getHoliday(selectedDate);

    // Helper for calendar view
    const getEventsForDateSync = (date: Date) => {
        return allEventRules.filter(e => shouldShowEvent(e, date));
    };

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
        <div className="min-h-screen bg-[#050505] text-white pb-40 font-sans selection:bg-red-500/30 relative overflow-x-hidden overscroll-none">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-900/20 rounded-full blur-[120px] mix-blend-screen will-change-transform" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen will-change-transform" />
                <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay"></div>
            </div>

            {/* Bottom Fade for smooth edge */}
            <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-40" />

            {/* Header */}
            <header className="sticky top-0 z-50 pt-6 pb-4 px-4 transition-all duration-300">
                <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl" />

                <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-5">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between w-full">
                        <div className="w-10" /> {/* Spacer */}
                        <div className="flex flex-col items-center gap-1 opacity-90">
                            <div className="flex items-center gap-3">
                                <img src="/logo.png" alt="Logo" className="h-8 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                                <div className="h-4 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                                <span className="text-[10px] tracking-[0.4em] uppercase font-semibold text-white/70">Day At A Glance</span>
                            </div>
                            <div className="text-[9px] text-white/50 tracking-wider uppercase font-mono">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                            {viewMode === 'list' ? <CalendarIcon className="w-4 h-4 text-white/70" /> : <List className="w-4 h-4 text-white/70" />}
                        </button>
                    </div>

                    {/* Property Toggle */}
                    <div className="flex bg-black/40 rounded-full border border-white/10 p-1 relative">
                        {['All', 'Lincoln', 'Tiverton'].map((prop) => (
                            <button
                                key={prop}
                                onClick={() => setSelectedProperty(prop as any)}
                                className={`relative z-10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${selectedProperty === prop ? 'text-white' : 'text-white/40 hover:text-white/70'
                                    }`}
                            >
                                {selectedProperty === prop && (
                                    <motion.div
                                        layoutId="activeProperty"
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {prop === 'All' ? 'All Properties' : prop}
                            </button>
                        ))}
                    </div>

                    {/* Stealth Admin Button */}
                    {onAdminOpen && (
                        <button
                            onClick={onAdminOpen}
                            className="w-2 h-2 rounded-full bg-white/5 hover:bg-red-500/50 transition-colors absolute top-2 right-2"
                            title="Admin Panel"
                        />
                    )}

                    {/* Date Navigator (Only in List Mode) */}
                    <AnimatePresence mode="wait">
                        {viewMode === 'list' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-3 w-full max-w-md"
                            >
                                <div className="flex items-center justify-between bg-white/5 rounded-full p-1.5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md">
                                    <button
                                        onClick={handlePrevDay}
                                        className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-95 group"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
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
                                                <h2 className="text-sm font-semibold tracking-widest text-white/90 whitespace-nowrap uppercase">
                                                    {formatDate(selectedDate)}
                                                </h2>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        onClick={handleNextDay}
                                        className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-95 group"
                                    >
                                        <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
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
                                            className="w-full px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 group"
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
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-green-500/20 border border-white/10 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                    <span className="text-xl filter drop-shadow-lg">{holiday.emoji}</span>
                                    <span className="text-sm font-bold uppercase tracking-wider text-white/90 text-glow">{holiday.name}</span>
                                    <span className="text-xl filter drop-shadow-lg">{holiday.emoji}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Snow Effect for Christmas */}
                    {holiday?.name === "Merry Christmas!" && <SnowEffect />}

                    {/* Tabs (Only in List Mode) */}
                    <AnimatePresence>
                        {viewMode === 'list' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex p-1 bg-black/40 rounded-xl border border-white/10 w-full max-w-md relative shadow-inner"
                            >
                                {['events', 'schedules', 'internal'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] relative z-10 transition-colors duration-300 ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                                    >
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-white/10 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                            />
                                        )}
                                        {tab}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
                <AnimatePresence mode="wait">
                    {viewMode === 'calendar' ? (
                        <CalendarView
                            key="calendar-view"
                            selectedDate={selectedDate}
                            getEvents={getEventsForDateSync}
                            onSelectDate={(date) => {
                                setSelectedDate(date);
                                setViewMode('list');
                            }}
                        />
                    ) : (
                        <div key="list-view">
                            {activeTab === 'events' && (
                                <motion.div
                                    key={`events-${selectedDate.toISOString()}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-10"
                                >
                                    {/* Invited Guest Events */}
                                    <Section 
                                        title="Invited Guest Events" 
                                        icon={<Star className="w-4 h-4 text-yellow-500" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Invited') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Invited').map((event, index) => (
                                                <EventCard key={event.id} event={event} index={index} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Invited').length === 0 && (
                                            <EmptyState message="No invited guest events scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Invited') : undefined} />
                                        )}
                                    </Section>

                                    {/* Open To All */}
                                    <Section 
                                        title="Open To All Guests" 
                                        icon={<Gift className="w-4 h-4 text-red-500" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Open') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Open').map((event, index) => (
                                                <EventCard key={event.id} event={event} index={index} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Open').length === 0 && (
                                            <EmptyState message="No open events scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Open') : undefined} />
                                        )}
                                    </Section>

                                    {/* Dining Offers */}
                                    <Section 
                                        title="Dining & Happy Hours" 
                                        icon={<Utensils className="w-4 h-4 text-blue-400" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Dining') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Dining').map((event, index) => (
                                                <EventCard key={event.id} event={event} index={index} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Dining').length === 0 && (
                                            <EmptyState message="No dining specials scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Dining') : undefined} />
                                        )}
                                    </Section>

                                    {/* Promo Events */}
                                    <Section 
                                        title="Promotions" 
                                        icon={<Gift className="w-4 h-4 text-purple-400" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Promo') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Promo').map((event, index) => (
                                                <EventCard key={event.id} event={event} index={index} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Promo').length === 0 && (
                                            <EmptyState message="No promotions scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Promo') : undefined} />
                                        )}
                                    </Section>

                                    {/* Entertainment */}
                                    <Section 
                                        title="Entertainment" 
                                        icon={<Music className="w-4 h-4 text-pink-400" />}
                                        onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Entertainment') : undefined}
                                    >
                                        <div className="space-y-4">
                                            {events.filter(e => e.category === 'Entertainment').map((event, index) => (
                                                <EventCard key={event.id} event={event} index={index} onEdit={onEditEvent} />
                                            ))}
                                        </div>
                                        {events.filter(e => e.category === 'Entertainment').length === 0 && (
                                            <EmptyState message="No entertainment scheduled." onAddEvent={onAddEvent ? () => onAddEvent(selectedDate, 'Entertainment') : undefined} />
                                        )}
                                    </Section>
                                </motion.div>
                            )}

                            {activeTab === 'schedules' && (
                                <motion.div
                                    key="schedules"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    {Object.entries(schedules)
                                        .filter(([category]) => category !== 'Important Numbers')
                                        .map(([category, items]) => (
                                            <div
                                                key={category}
                                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors duration-300 relative"
                                            >
                                                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-white/40" />
                                                    <h3 className="text-xs font-bold text-white/90 uppercase tracking-[0.2em]">{category}</h3>
                                                </div>
                                                <div className="p-2">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors group">
                                                            <span className="font-medium text-sm text-white/80 group-hover:text-white transition-colors">{item.name}</span>
                                                            <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-1 rounded-md border border-white/5">{item.time}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </motion.div>
                            )}

                            {activeTab === 'internal' && (
                                <motion.div
                                    key="internal"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8"
                                >
                                    {/* Promo Info */}
                                    <Section title="Promotions (Internal)" icon={<Info className="w-4 h-4 text-purple-400" />}>
                                        {events.filter(e => e.category === 'Promo').map((event, index) => (
                                            <EventCard key={event.id} event={event} index={index} />
                                        ))}

                                    </Section>

                                    {/* Phone Numbers */}
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                                        <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-white/40" />
                                            <h3 className="text-xs font-bold text-white/90 uppercase tracking-[0.2em]">Important Numbers</h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {phoneNumbers.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-3.5 rounded-xl border border-white/5 transition-all group cursor-pointer hover:border-white/10">
                                                    <span className="text-sm font-medium text-white/80 group-hover:text-white">{item.name}</span>
                                                    <span className="text-xs font-mono text-yellow-500/80 group-hover:text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">{item.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </main>
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
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
        >
            <div className="flex items-center justify-between mb-8">
                <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-white/70" />
                </button>
                <h2 className="text-lg font-bold text-white tracking-widest uppercase">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-white/70" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-white/30 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((date, idx) => {
                    if (!date) return <div key={idx} />;
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const hasEvents = getEvents(date).length > 0;

                    return (
                        <button
                            key={idx}
                            onClick={() => onSelectDate(date)}
                            className={`
                                relative h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-200
                                ${isSelected ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}
                                ${isToday && !isSelected ? 'border border-red-500/50' : ''}
                            `}
                        >
                            <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>{date.getDate()}</span>
                            {hasEvents && !isSelected && (
                                <div className="w-1 h-1 rounded-full bg-red-500 mt-1" />
                            )}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

function Section({ title, icon, children, onAddEvent }: { title: string, icon: React.ReactNode, children: React.ReactNode, onAddEvent?: () => void }) {
    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-5 px-2 opacity-70">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em]">{title}</h3>
                </div>
                {onAddEvent && (
                    <button 
                        onClick={onAddEvent}
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors"
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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02] group hover:bg-white/5 transition-colors cursor-pointer" onClick={onAddEvent}>
            <CalendarIcon className="w-8 h-8 text-white/10 mb-3 group-hover:text-white/20 transition-colors" />
            <p className="text-white/30 text-sm italic mb-2">{message}</p>
            {onAddEvent && (
                <span className="text-xs text-red-400/70 font-bold uppercase tracking-wider group-hover:text-red-400 transition-colors">
                    Click to add event
                </span>
            )}
        </div>
    );
}

function EventCard({ event, index = 0, onEdit }: { event: Event, index?: number, onEdit?: (event: Event) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, ease: "easeOut" }}
            className={`relative overflow-hidden rounded-2xl border transition-colors duration-200 group transform-gpu [backface-visibility:hidden] ${event.highlight
                ? 'bg-gradient-to-br from-yellow-900/20 to-black border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 hover:shadow-xl'
                }`}
        >
            {onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(event);
                    }}
                    className="absolute top-3 right-3 z-20 p-2 bg-black/50 hover:bg-red-500/80 text-white/70 hover:text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                    title="Edit Event"
                >
                    <Edit2 className="w-3 h-3" />
                </button>
            )}
            {event.highlight && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-bl-xl z-10 shadow-lg">
                    Featured
                </div>
            )}

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                        {event.property && event.property !== 'Both' && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block ${
                                event.property === 'Lincoln' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                                {event.property === 'Lincoln' ? "Bally's Lincoln" : "Bally's Tiverton"}
                            </span>
                        )}
                        <h4 className={`text-lg font-bold leading-tight ${event.highlight ? 'text-yellow-400' : 'text-white'}`}>
                            {event.title}
                        </h4>
                    </div>
                </div>

                <p className="text-white/70 text-sm leading-relaxed mb-5 font-light">
                    {event.description}
                </p>

                {event.media && event.media.length > 0 && (
                    <div className="mb-5 grid grid-cols-2 gap-2">
                        {event.media.map((item, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40 group/media">
                                {item.type === 'image' ? (
                                    <div className="aspect-video relative cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                                        <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110" />
                                        <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/media:opacity-100">
                                            <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/50 px-2 py-1 rounded backdrop-blur-md">View</span>
                                        </div>
                                    </div>
                                ) : (
                                    <a href={item.url} download={item.name} className="flex flex-col items-center justify-center p-4 gap-2 hover:bg-white/5 transition-colors aspect-video text-center">
                                        <FileText className="w-8 h-8 text-white/50 group-hover/media:text-white/80 transition-colors" />
                                        <span className="text-xs text-white/60 group-hover/media:text-white/90 truncate w-full px-2">{item.name}</span>
                                        <span className="text-[9px] uppercase tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded">PDF</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {event.details && (
                    <ul className="space-y-2.5 mb-5">
                        {event.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-xs text-white/60">
                                <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${event.highlight ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                <span className="leading-relaxed">{detail}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {event.meta && (
                    <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/5">
                        {event.meta.map((meta, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{meta.label}</span>
                                <span className="text-xs text-white/90 font-medium">{meta.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
