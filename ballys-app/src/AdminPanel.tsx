import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Upload, Download,
  AlertCircle, FileText, Star, Settings, Check, Globe, Eye, ArrowUpDown, ChevronLeft, Search, Menu,
  Megaphone, Archive, Copy, LayoutTemplate, RotateCcw
} from 'lucide-react';
import type { AdminEvent, ScheduleItem, Announcement } from './types';
import { eventService } from './services/eventService';
import { getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from './services/announcementService';
import AnnouncementForm from './components/AnnouncementForm';
import Dashboard from './Dashboard';
import BigCalendar from './components/Calendar/BigCalendar';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['Invited', 'Open', 'Dining', 'Promo', 'Internal', 'Schedule', 'Entertainment'] as const;

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  // Local state (working copy)
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [schedules, setSchedules] = useState<Record<string, ScheduleItem[]>>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Persisted state (live copy)
  const [savedEvents, setSavedEvents] = useState<AdminEvent[]>([]);
  const [savedSchedules, setSavedSchedules] = useState<Record<string, ScheduleItem[]>>({});
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [activeView, setActiveView] = useState<'events' | 'schedules' | 'announcements' | 'archive' | 'templates'>('events');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewEditId, setPreviewEditId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'last-edited' | 'property'>('date-desc');
  const [eventsViewMode] = useState<'list' | 'calendar'>('list');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check for mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    const loadedEvents = await eventService.getEvents();
    const loadedSchedules = await eventService.getSchedules();
    const loadedTags = await eventService.getTags();
    const loadedAnnouncements = await getAllAnnouncements();
    
    setEvents(loadedEvents);
    setSavedEvents(JSON.parse(JSON.stringify(loadedEvents))); // Deep copy
    
    setSchedules(loadedSchedules);
    setSavedSchedules(JSON.parse(JSON.stringify(loadedSchedules))); // Deep copy

    setAvailableTags(loadedTags);
    setAnnouncements(loadedAnnouncements);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshTags = async () => {
      const tags = await eventService.getTags();
      setAvailableTags(tags);
  };


  // Helper to check if an event has unsaved changes
  const getEventStatus = (event: AdminEvent) => {
    const saved = savedEvents.find(e => e.id === event.id);
    if (!saved) return 'new'; // Not in saved list -> New
    
    // Compare fields
    const currentStr = JSON.stringify(event);
    const savedStr = JSON.stringify(saved);
    return currentStr !== savedStr ? 'modified' : 'synced';
  };

  // Helper to check if a schedule category has unsaved changes
  const getScheduleStatus = (category: string) => {
    const current = schedules[category];
    const saved = savedSchedules[category];
    
    if (!saved) return 'new';
    return JSON.stringify(current) !== JSON.stringify(saved) ? 'modified' : 'synced';
  };

  // Calculate total unsaved changes
  const hasUnsavedChanges = () => {
    const eventsChanged = events.some(e => getEventStatus(e) !== 'synced') || 
                          events.length !== savedEvents.length; // Length check catches deletions (roughly)
                          
    const schedulesChanged = Object.keys(schedules).some(cat => getScheduleStatus(cat) !== 'synced') ||
                             Object.keys(schedules).length !== Object.keys(savedSchedules).length;
                             
    return eventsChanged || schedulesChanged;
  };

  const handlePublishAll = async () => {
    try {
      // Validate events before saving
      const validEvents = events.filter(e => e.id && e.title);
      
      await eventService.saveEvents(validEvents);
      await eventService.saveSchedules(schedules);
      
      // Update saved state to match current
      setSavedEvents(JSON.parse(JSON.stringify(validEvents)));
      setSavedSchedules(JSON.parse(JSON.stringify(schedules)));
      
      showToast('All changes published successfully to live site!');
    } catch (e) {
      console.error('Failed to publish:', e);
      alert('Failed to publish changes. Please try again.');
    }
  };

  const addScheduleCategory = (categoryName: string) => {
    const updated = { ...schedules, [categoryName]: [] };
    setSchedules(updated);
  };

  const removeScheduleCategory = (category: string) => {
    const updated = { ...schedules };
    delete updated[category];
    setSchedules(updated);
  };

  const handleAdd = (initialDate?: Date, initialCategory?: string) => {
    const newEvent: AdminEvent = {
      id: `event-${Date.now()}`,
      title: '',
      category: (initialCategory as any) || 'Open',
      description: '',
      details: [],
      meta: [],
      media: [],
      highlight: false,
      startDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: '00:00',
      endTime: '23:59',
      daysOfWeek: [],
      isRecurring: false,
      property: 'Both',
      isArchived: false,
      isTemplate: activeView === 'templates'
    };
    setEvents([...events, newEvent]);
    setEditingId(newEvent.id);
    setShowAddForm(true);
    setShowBulkUpload(false);
    // Stay in current view if templates, otherwise go to events
    if (activeView !== 'templates') setActiveView('events');
    
    // Reset category filter if new event is hidden by it
    if (filterCategory !== 'all' && filterCategory !== newEvent.category) {
      setFilterCategory('all');
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowAddForm(true);
    setShowBulkUpload(false);
  };

  const handleDuplicate = (event: AdminEvent) => {
    const duplicatedEvent: AdminEvent = {
        ...event,
        id: `event-${Date.now()}`,
        title: `${event.title} (Copy)`,
        lastUpdated: new Date().toISOString()
    };
    setEvents([...events, duplicatedEvent]);
    showToast('Event duplicated');
    setEditingId(duplicatedEvent.id);
    setShowAddForm(true);
  };

  const handleArchive = (event: AdminEvent) => {
      const updatedEvents = events.map(e => 
          e.id === event.id ? { ...e, isArchived: true, lastUpdated: new Date().toISOString() } : e
      );
      setEvents(updatedEvents);
      showToast('Event archived');
  };

  const handleRestore = (event: AdminEvent) => {
      const updatedEvents = events.map(e => 
          e.id === event.id ? { ...e, isArchived: false, lastUpdated: new Date().toISOString() } : e
      );
      setEvents(updatedEvents);
      showToast('Event restored');
  };

  const handleSaveAsTemplate = (event: AdminEvent) => {
      const template: AdminEvent = {
          ...event,
          id: `template-${Date.now()}`,
          title: `${event.title} Template`,
          isTemplate: true,
          isArchived: false,
          lastUpdated: new Date().toISOString()
      };
      setEvents([...events, template]);
      showToast('Saved as template');
  };

  const handleUseTemplate = (template: AdminEvent) => {
      const newEvent: AdminEvent = {
          ...template,
          id: `event-${Date.now()}`,
          title: template.title.replace(' Template', ''),
          isTemplate: false,
          isArchived: false,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString()
      };
      setEvents([...events, newEvent]);
      setEditingId(newEvent.id);
      setShowAddForm(true);
      setActiveView('events');
      showToast('Created new event from template');
  };


  const handleBulkDelete = () => {
    if (selectedEvents.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedEvents.size} items(s)?`)) {
      setEvents(events.filter(e => !selectedEvents.has(e.id)));
      setSelectedEvents(new Set());
    }
  };

  const handleSaveEvent = async (eventData: AdminEvent, publish: boolean = false) => {
    if (!eventData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    const eventToSave = {
      ...eventData,
      lastUpdated: new Date().toISOString()
    };

    // Check if event exists (handling both sidebar edit and preview modal edit)
    const exists = events.some(e => e.id === eventToSave.id);

    const updated = exists
      ? events.map(e => e.id === eventToSave.id ? eventToSave : e)
      : [...events, eventToSave];

    setEvents(updated);
    
    if (publish) {
      try {
        await eventService.saveEvents(updated);
        await eventService.saveSchedules(schedules); // Save schedules too just in case
        
        setSavedEvents(JSON.parse(JSON.stringify(updated)));
        setSavedSchedules(JSON.parse(JSON.stringify(schedules)));
        
        showToast('Event saved and published successfully!');
      } catch (e) {
        console.error('Failed to publish:', e);
        alert('Failed to publish. Draft saved locally.');
      }
    } else {
       showToast('Draft saved. Click "Publish All" to go live.');
    }

    setEditingId(null);
    setShowAddForm(false);
  };

  const handleBulkUpload = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      
      // Check if it's a full backup object
      if (!Array.isArray(parsed) && parsed.events && Array.isArray(parsed.events)) {
        if (confirm(`Found full backup (v${parsed.version || '1.0'}) from ${new Date(parsed.timestamp).toLocaleDateString() || 'unknown date'}. \n\nThis will REPLACE your current working changes with the backup data. Continue?`)) {
          setEvents(parsed.events);
          if (parsed.schedules) setSchedules(parsed.schedules);
          
          if (parsed.tags && Array.isArray(parsed.tags)) {
             setAvailableTags(parsed.tags);
             // Persist tags
             for (const tag of parsed.tags) {
                 await eventService.saveTag(tag);
             }
          }
          
          alert('Backup data loaded into editor. Click "Publish All" to save changes to the live site.');
          setBulkJson('');
          setShowBulkUpload(false);
          return;
        } else {
          return;
        }
      }

      if (!Array.isArray(parsed)) {
        alert('JSON must be an array of events or a valid backup object');
        return;
      }

      // Validate and merge events
      const validEvents = parsed.filter((e: any) => e.id && e.title);
      if (validEvents.length === 0) {
        alert('No valid events found in JSON');
        return;
      }

      // Merge with existing (replace duplicates by id)
      const existingIds = new Set(events.map(e => e.id));
      const newEvents = validEvents.filter((e: any) => !existingIds.has(e.id));
      const updatedEvents = [
        ...events.map(e => {
          const updated = validEvents.find((ve: any) => ve.id === e.id);
          return updated || e;
        }),
        ...newEvents
      ];

      setEvents(updatedEvents);
      setBulkJson('');
      setShowBulkUpload(false);
      alert(`Successfully processed ${validEvents.length} event(s). Click Publish to save.`);
    } catch (e) {
      console.error(e);
      alert('Invalid JSON format');
    }
  };

  const handleExport = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      events,
      schedules,
      tags: availableTags
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ballys-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMobileMenu(false);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedEvents);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEvents(newSet);
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredEvents();
    if (selectedEvents.size === filtered.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filtered.map(e => e.id)));
    }
  };

  const getFilteredEvents = () => {
    const term = searchTerm.toLowerCase().trim();
    
    const filtered = events.filter(e => {
      // Filter by view type
      if (activeView === 'events' && (e.isArchived || e.isTemplate)) return false;
      if (activeView === 'archive' && !e.isArchived) return false;
      if (activeView === 'templates' && !e.isTemplate) return false;

      const matchesSearch = !term ||
        e.title.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.category.toLowerCase().includes(term) ||
        e.property?.toLowerCase().includes(term) ||
        e.details?.some(d => d.toLowerCase().includes(term)) ||
        e.meta?.some(m => m.label.toLowerCase().includes(term) || m.value.toLowerCase().includes(term));
        
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return (b.startDate || '0000-00-00').localeCompare(a.startDate || '0000-00-00');
        case 'date-asc':
          return (a.startDate || '9999-12-31').localeCompare(b.startDate || '9999-12-31');
        case 'last-edited':
          return (b.lastUpdated || '').localeCompare(a.lastUpdated || '');
        case 'property':
          return (a.property || 'Both').localeCompare(b.property || 'Both');
        default:
          return 0;
      }
    });
  };

  const filteredEvents = getFilteredEvents();
  const currentEvent = editingId ? events.find(e => e.id === editingId) : null;

  // Should we show the list view or the detail view?
  const showList = !isMobile || (!editingId && !showAddForm && !showBulkUpload && !showPreview);
  const showDetail = editingId || showAddForm || showBulkUpload;

  return (
    <div className="fixed inset-0 z-[100] bg-background text-text-main overflow-hidden font-sans flex flex-col">
      {/* Preview Mode Overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="sticky top-0 z-[210] bg-ballys-red text-white px-4 py-2 flex items-center justify-between shadow-md pt-safe-top">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Eye className="w-4 h-4" />
              PREVIEW MODE
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
            >
              Exit Preview
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
             <Dashboard 
               previewEvents={events} 
               previewSchedules={schedules} 
               onAdminOpen={() => setShowPreview(false)}
               onEditEvent={(event) => {
                 setPreviewEditId(event.id);
               }}
               onAddEvent={(date, category) => {
                 setShowPreview(false);
                 handleAdd(date, category);
               }}
             />
          </div>

          {/* Preview Edit Modal */}
          {previewEditId && (
            <div className="fixed inset-0 z-[220] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex-1 overflow-y-auto">
                        {(() => {
                            const eventToEdit = events.find(e => e.id === previewEditId);
                            if (!eventToEdit) return null;
                            
                            return (
                                <EventForm
                                    event={eventToEdit}
                                    availableTags={availableTags}
                                    onRefreshTags={refreshTags}
                                    onSave={(data, publish) => {
                                        handleSaveEvent(data, publish);
                                        setPreviewEditId(null);
                                    }}
                                />
                            );
                        })()}
                    </div>
                </div>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-2xl border-b border-border/50 px-6 py-4 shadow-lg shadow-black/5 pt-safe-top transition-all">
        <div className="flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4 min-w-0">
            <div className="bg-gradient-to-br from-ballys-red to-red-600 p-2.5 rounded-xl shadow-lg shadow-red-500/20 shrink-0 text-white ring-1 ring-white/20">
                 <Settings className="w-6 h-6" />
            </div>
            <div className="truncate flex flex-col">
              <h1 className="text-xl font-bold text-text-main truncate tracking-tight">Admin Portal</h1>
              <p className="text-[11px] text-text-muted uppercase tracking-widest font-semibold truncate">Content Management System</p>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
               <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border/50 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm group"
                title="Export Backup"
              >
                <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-slate-600 transition-colors">
                    <Download className="w-3.5 h-3.5" /> 
                </div>
                <span className="hidden lg:inline">Export</span>
              </button>

              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2.5 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border/50 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm group"
              >
                <div className="bg-blue-50 dark:bg-blue-900/30 p-1 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                </div>
                <span>Preview</span>
              </button>
              
              <div className="h-8 w-px bg-border/50 mx-1" />
              
               <button
                onClick={handlePublishAll}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm border ${
                  hasUnsavedChanges()
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-900/20 border-transparent ring-2 ring-green-500/20'
                    : 'bg-surface text-text-muted border-border hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-text-main'
                }`}
              >
                {hasUnsavedChanges() ? <Globe className="w-4 h-4 animate-pulse" /> : <Check className="w-4 h-4" />}
                {hasUnsavedChanges() ? 'Publish Changes' : 'Published'}
              </button>

              <button
                onClick={onClose}
                className="ml-2 p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-600 rounded-xl transition-all duration-300 hover:rotate-90 active:scale-90 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                title="Close Admin"
              >
                <X className="w-5 h-5" />
              </button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
             <button
                onClick={handlePublishAll}
                className={`p-2 rounded-lg transition-all ${
                  hasUnsavedChanges()
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Globe className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-text-main" />
              </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
            {showMobileMenu && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden overflow-hidden bg-surface border-t border-border mt-3"
                >
                    <div className="py-2 space-y-1">
                        <button onClick={() => { setShowPreview(true); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                            <Eye className="w-4 h-4" /> Preview Site
                        </button>
                        <button onClick={handleExport} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                            <Download className="w-4 h-4" /> Export Data
                        </button>
                         <button onClick={() => { 
                             if(confirm('Log out?')) { localStorage.removeItem('ballys_auth'); window.location.reload(); } 
                         }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-red-600">
                             Log Out
                         </button>
                         <button onClick={onClose} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 font-semibold border-t border-border">
                            <X className="w-4 h-4" /> Close Admin
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </header>

      <div className="flex-1 overflow-hidden flex relative">
        {/* Sidebar / List View */}
        <div className={`
            flex-1 md:w-96 md:flex-none border-r border-border bg-surface/60 backdrop-blur-xl overflow-y-auto scroll-smooth overscroll-contain
            ${showList ? 'block' : 'hidden md:block'}
        `}>
            {/* View Toggle Tabs */}
             <div className="p-4 pb-0 sticky top-0 z-10 bg-surface/95 backdrop-blur-xl border-b border-border/50">
                <div className="flex bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-border/50 overflow-x-auto no-scrollbar backdrop-blur-md gap-1">
                  <button
                    onClick={() => setActiveView('events')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${activeView === 'events'
                      ? 'bg-surface text-text-main shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-text-muted hover:text-text-main hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    Events
                  </button>
                  <button
                    onClick={() => setActiveView('schedules')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${activeView === 'schedules'
                      ? 'bg-surface text-text-main shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-text-muted hover:text-text-main hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    Schedules
                  </button>
                  <button
                    onClick={() => setActiveView('announcements')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${activeView === 'announcements'
                      ? 'bg-surface text-text-main shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-text-muted hover:text-text-main hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    Alerts
                  </button>
                  <button
                    onClick={() => setActiveView('archive')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${activeView === 'archive'
                      ? 'bg-surface text-text-main shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-text-muted hover:text-text-main hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => setActiveView('templates')}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${activeView === 'templates'
                      ? 'bg-surface text-text-main shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-text-muted hover:text-text-main hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    Templates
                  </button>
                </div>
             </div>

          {(activeView === 'events' || activeView === 'archive' || activeView === 'templates') ? (
            <div className="p-4 space-y-4">
              {/* Search & Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-text-light absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={`Search ${activeView}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 pl-9 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-sm text-text-main"
                  />
                  {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-text-light">
                          <X className="w-4 h-4" />
                      </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-main"
                  >
                    <option value="all">All Cats</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as any)}
                      className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-main"
                    >
                      <option value="date-desc">Newest</option>
                      <option value="date-asc">Oldest</option>
                      <option value="last-edited">Edited</option>
                    </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedEvents.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center justify-between"
                >
                  <span className="text-xs text-red-800 dark:text-red-400">{selectedEvents.size} selected</span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <button
                  onClick={() => handleAdd()}
                  className="px-4 py-2.5 bg-surface border border-border hover:border-ballys-red/50 hover:bg-ballys-red/5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 text-text-main hover:text-ballys-red shadow-sm hover:shadow-md group"
                >
                  <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-lg group-hover:bg-ballys-red/10 group-hover:text-ballys-red transition-colors">
                      <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                  </div>
                  <span className="hidden sm:inline">{activeView === 'templates' ? 'New Template' : 'Add Event'}</span>
                  <span className="sm:hidden">Add</span>
                </button>
                {activeView === 'events' && (
                    <button
                        onClick={() => {
                            // Find duplicates (same title AND same start date)
                            const seen = new Set();
                            const duplicates: AdminEvent[] = [];
                            
                            events.forEach(e => {
                                if (e.isArchived || e.isTemplate) return;
                                const key = `${e.title?.toLowerCase().trim()}|${e.startDate}`;
                                if (seen.has(key)) {
                                    duplicates.push(e);
                                } else {
                                    seen.add(key);
                                }
                            });
                            
                            if (duplicates.length === 0) {
                                alert('No duplicate events found (checked by Title + Date).');
                                return;
                            }

                            if (confirm(`Found ${duplicates.length} duplicate events (same title & date). Select them for deletion?`)) {
                                const dupIds = new Set(duplicates.map(d => d.id));
                                setSelectedEvents(dupIds);
                                showToast(`Selected ${duplicates.length} duplicates. Review and click Delete.`);
                            }
                        }}
                        className="px-3 py-2.5 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border hover:border-gray-300 dark:hover:border-gray-600 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-text-muted hover:text-text-main shadow-sm"
                        title="Find Duplicates"
                    >
                        <span className="font-mono font-bold text-xs">DUP</span>
                    </button>
                )}
                <button
                  onClick={() => {
                    setShowBulkUpload(true);
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-2.5 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border hover:border-gray-300 dark:hover:border-gray-600 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-text-muted hover:text-text-main shadow-sm group"
                  title="Bulk Upload JSON"
                >
                  <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </button>
              </div>

              {/* Event List */}
              <div className="space-y-2 pb-20">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs text-text-light uppercase tracking-wider">
                    {activeView === 'events' ? 'Live Events' : activeView === 'archive' ? 'Archived' : 'Templates'} ({filteredEvents.length})
                  </span>
                  {filteredEvents.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      className="text-xs text-text-light hover:text-text-main transition-colors"
                    >
                      {selectedEvents.size === filteredEvents.length ? 'None' : 'All'}
                    </button>
                  )}
                </div>
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 text-text-light text-sm border border-dashed border-border rounded-lg bg-gray-50 dark:bg-slate-800">
                    No items found
                  </div>
                ) : (
                  filteredEvents.map(event => {
                    const status = getEventStatus(event);
                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden group ${editingId === event.id
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-md scale-[1.01]'
                          : 'bg-surface border-border hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        onClick={() => handleEdit(event.id)}
                      >
                        {/* Status Indicator Strip */}
                        {status !== 'synced' && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            status === 'new' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        )}
                        
                        <div className="flex items-start gap-3 pl-2">
                          <input
                            type="checkbox"
                            checked={selectedEvents.has(event.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(event.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-ballys-red focus:ring-ballys-red"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold text-sm truncate ${editingId === event.id ? 'text-red-900 dark:text-red-400' : 'text-text-main'}`}>{event.title || 'Untitled'}</h3>
                              {event.highlight && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700">
                                  {event.isRecurring 
                                      ? 'Weekly'
                                      : (event.startDate ? new Date(event.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date')
                                  }
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-text-muted border border-border">
                                {event.category}
                              </span>
                            </div>
                            
                            {/* Action Bar on Hover */}
                            <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity border-t border-border pt-2">
                                {activeView === 'events' && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(event); }} className="text-xs text-text-muted hover:text-ballys-blue flex items-center gap-1">
                                            <Copy className="w-3 h-3" /> Dup
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleSaveAsTemplate(event); }} className="text-xs text-text-muted hover:text-ballys-blue flex items-center gap-1">
                                            <LayoutTemplate className="w-3 h-3" /> Save Tmpl
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleArchive(event); }} className="text-xs text-text-muted hover:text-red-500 flex items-center gap-1">
                                            <Archive className="w-3 h-3" /> Archive
                                        </button>
                                    </>
                                )}
                                {activeView === 'archive' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleRestore(event); }} className="text-xs text-text-muted hover:text-green-500 flex items-center gap-1">
                                        <RotateCcw className="w-3 h-3" /> Restore
                                    </button>
                                )}
                                {activeView === 'templates' && (
                                    <button onClick={(e) => { e.stopPropagation(); handleUseTemplate(event); }} className="text-xs text-text-muted hover:text-ballys-blue flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Use Template
                                    </button>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeView === 'announcements' ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Global Alerts</h3>
                <button 
                   onClick={() => {
                       setEditingId('new-announcement');
                       setShowAddForm(true);
                   }}
                   className="px-3 py-1.5 bg-ballys-red hover:bg-ballys-darkRed rounded-lg text-xs font-medium flex items-center gap-2 transition-colors text-white shadow-sm"
                >
                   <Plus className="w-3 h-3" />
                   New
                </button>
              </div>
              <div className="space-y-2">
                {announcements.map(ann => (
                   <div 
                       key={ann.id}
                       onClick={() => {
                           setEditingId(ann.id);
                           setShowAddForm(true);
                       }}
                       className={`p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${editingId === ann.id ? 'bg-red-50 border-red-200' : 'bg-surface border-border hover:bg-gray-50'}`}
                   >
                       {ann.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                       <div className="flex items-start gap-3 pl-2">
                            {ann.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />}
                            {ann.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                            {ann.type === 'info' && <Megaphone className="w-4 h-4 text-blue-500 mt-0.5" />}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-main line-clamp-2">{ann.message}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                        ann.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {ann.active ? 'Active' : 'Inactive'}
                                    </span>
                                    {ann.expirationDate && (
                                        <span className="text-[10px] text-text-muted truncate">
                                            Exp: {new Date(ann.expirationDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                       </div>
                   </div>
               ))}
               {announcements.length === 0 && (
                   <div className="text-center py-8 text-text-light text-sm border border-dashed border-border rounded-lg">
                       No alerts found
                   </div>
               )}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Categories</h3>
                <button
                  onClick={() => {
                    const name = prompt('Enter category name:');
                    if (name) addScheduleCategory(name);
                  }}
                  className="px-3 py-1.5 bg-ballys-red hover:bg-ballys-darkRed rounded-lg text-xs font-medium flex items-center gap-2 transition-colors text-white shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {Object.keys(schedules).map((category) => {
                  const status = getScheduleStatus(category);
                  return (
                    <div
                      key={category}
                      onClick={() => setEditingId(category)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${editingId === category
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-sm'
                        : 'bg-surface border-border hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      {/* Status Indicator Strip */}
                      {status !== 'synced' && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          status === 'new' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      )}
                      <div className="flex items-center justify-between pl-2">
                        <div className="flex items-center gap-2">
                           <h4 className={`font-semibold text-sm ${editingId === category ? 'text-red-900 dark:text-red-400' : 'text-text-main'}`}>{category}</h4>
                        </div>
                        <span className="text-xs text-text-light">{schedules[category].length} items</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Edit Form / Details */}
        <div className={`
            flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth overscroll-contain bg-gray-50/50 dark:bg-slate-950/50
            absolute inset-0 md:relative bg-background z-10 md:z-auto
            ${showDetail ? 'block' : 'hidden md:block'}
        `}>
          {/* Mobile Back Button */}
          <div className="md:hidden mb-4 flex items-center gap-2">
              <button onClick={() => { setEditingId(null); setShowAddForm(false); setShowBulkUpload(false); }} className="flex items-center gap-1 text-sm font-medium text-text-muted">
                  <ChevronLeft className="w-4 h-4" /> Back to List
              </button>
          </div>

          {eventsViewMode === 'calendar' && activeView === 'events' && !isMobile ? (
              <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                       <div>
                          <h2 className="text-2xl font-bold text-text-main">Calendar Management</h2>
                          <p className="text-sm text-text-muted">Drag to select days, click to edit events.</p>
                      </div>
                      <button
                          onClick={() => handleAdd()}
                          className="px-4 py-2.5 bg-ballys-red hover:bg-red-700 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 text-white shadow-lg shadow-red-900/20 hover:shadow-red-900/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm group"
                      >
                          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                          New Event
                      </button>
                  </div>
                  <BigCalendar
                      events={events}
                      onSelectEvent={(event) => handleEdit(event.id)}
                      onSelectSlot={({ start }) => handleAdd(start)}
                  />
              </div>
          ) : (
          <AnimatePresence mode="wait">
            {(activeView === 'events' || activeView === 'archive' || activeView === 'templates') ? (
              showAddForm && currentEvent ? (
                <EventForm
                  key={editingId}
                  event={currentEvent}
                  availableTags={availableTags}
                  onRefreshTags={refreshTags}
                  onSave={handleSaveEvent}
                />
              ) : showBulkUpload ? (
                <BulkUploadForm
                  onUpload={handleBulkUpload}
                  onCancel={() => setShowBulkUpload(false)}
                  json={bulkJson}
                  onChange={setBulkJson}
                />
              ) : (
                <EmptyState />
              )
            ) : activeView === 'announcements' ? (
                editingId ? (
                    <AnnouncementForm 
                        announcement={announcements.find(a => a.id === editingId) || null}
                        onSave={async (ann) => {
                            if (announcements.some(a => a.id === ann.id)) {
                                await updateAnnouncement(ann);
                            } else {
                                await createAnnouncement(ann);
                            }
                            const loaded = await getAllAnnouncements();
                            setAnnouncements(loaded);
                            setEditingId(null);
                            setShowAddForm(false);
                            showToast('Alert saved successfully');
                        }}
                        onDelete={async (id) => {
                            if (confirm('Delete this alert?')) {
                                await deleteAnnouncement(id);
                                const loaded = await getAllAnnouncements();
                                setAnnouncements(loaded);
                                setEditingId(null);
                                setShowAddForm(false);
                                showToast('Alert deleted');
                            }
                        }}
                        onCancel={() => {
                            setEditingId(null);
                            setShowAddForm(false);
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 max-w-md shadow-sm mx-auto">
                            <Megaphone className="w-12 h-12 md:w-16 md:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2 text-text-main">Manage Alerts</h3>
                            <p className="text-text-muted text-sm">
                                Select an alert to edit or create a new one.
                            </p>
                        </div>
                    </div>
                )
            ) : editingId && schedules[editingId] ? (
              <ScheduleForm
                category={editingId}
                items={schedules[editingId]}
                onUpdate={(items) => {
                  const updated = { ...schedules, [editingId]: items };
                  setSchedules(updated);
                }}
                onDeleteCategory={() => {
                  if (confirm(`Delete category "${editingId}"?`)) {
                    removeScheduleCategory(editingId);
                    setEditingId(null);
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 max-w-md shadow-sm mx-auto">
                  <Settings className="w-12 h-12 md:w-16 md:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-text-main">No Category Selected</h3>
                  <p className="text-text-muted text-sm">
                    Select a schedule category from the list to edit.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[200] bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 border border-green-500"
          >
            <div className="bg-white/20 p-1 rounded-full">
              <Check className="w-4 h-4" />
            </div>
            <span className="font-medium">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScheduleForm({
  category,
  items,
  onUpdate,
  onDeleteCategory
}: {
  category: string;
  items: ScheduleItem[];
  onUpdate: (items: ScheduleItem[]) => void;
  onDeleteCategory: () => void;
}) {
  const [localItems, setLocalItems] = useState<ScheduleItem[]>(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const updateItem = (index: number, field: 'name' | 'time', value: string) => {
    const updated = [...localItems];
    updated[index] = { ...updated[index], [field]: value };
    setLocalItems(updated);
  };

  const addItem = () => {
    const updated = [...localItems, { name: '', time: '' }];
    setLocalItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
  };

  const handleSave = () => {
    onUpdate(localItems);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-surface border border-border rounded-2xl p-4 md:p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-main">{category}</h2>
            <p className="text-sm text-text-muted mt-1">Edit hours and locations</p>
          </div>
          <div className="flex gap-2 self-end md:self-auto">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-ballys-red/10 hover:bg-ballys-red/20 border border-ballys-red/20 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 text-ballys-red hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              <Check className="w-4 h-4" />
              Save Draft
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {localItems.map((item, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-2 md:items-center bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-border">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
                placeholder="Location name"
                className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
              />
              <input
                type="text"
                value={item.time}
                onChange={(e) => updateItem(index, 'time', e.target.value)}
                placeholder="Hours (e.g., 10am – 10pm)"
                className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
              />
              <button
                onClick={() => removeItem(index)}
                className="p-2 bg-surface hover:bg-red-50 dark:hover:bg-red-900/20 border border-border hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-colors text-text-light hover:text-red-600 dark:hover:text-red-400 self-end md:self-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="w-full px-4 py-3 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border border-dashed rounded-lg flex items-center justify-center gap-2 text-sm transition-all duration-200 text-text-muted hover:text-text-main hover:border-gray-400 hover:shadow-sm group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Add Item
          </button>
        </div>
         <div className="flex justify-end pt-4 border-t border-border">
            <button
                onClick={onDeleteCategory}
                className="px-4 py-2 text-red-600 text-sm font-medium hover:underline"
            >
                Delete Category
            </button>
        </div>
      </div>
    </motion.div >
  );
}

function MediaUpload({
  media,
  onChange
}: {
  media: AdminEvent['media'];
  onChange: (media: AdminEvent['media']) => void;
}) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia = [...(media || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type.startsWith('image/')) {
        // Compress image
        const compressed = await compressImage(file);
        if (compressed.length > 5 * 1024 * 1024) { // ~5MB base64 limit
            alert(`Image ${file.name} is too large even after compression. Please use a smaller image.`);
            continue;
        }
        newMedia.push({
          type: 'image',
          url: compressed,
          name: file.name
        });
      } else if (file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) {
             alert(`PDF ${file.name} is too large (>5MB).`);
             continue;
        }
        // Convert PDF to base64
        const base64 = await fileToBase64(file);
        newMedia.push({
          type: 'pdf',
          url: base64,
          name: file.name
        });
      }
    }

    onChange(newMedia);
  };

  const removeMedia = (index: number) => {
    const newMedia = [...(media || [])];
    newMedia.splice(index, 1);
    onChange(newMedia);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Media (Images & PDFs)
        </h3>
        <label className="px-3 py-1.5 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer text-text-main shadow-sm">
          <Plus className="w-4 h-4" />
          Add Media
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {media?.map((item, index) => (
          <div key={index} className="relative group bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-border aspect-video flex items-center justify-center">
            {item.type === 'image' ? (
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <FileText className="w-8 h-8" />
                <span className="text-xs truncate max-w-[90%] px-2">{item.name || 'PDF Document'}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
              <button
                onClick={() => removeMedia(index)}
                className="p-2 bg-surface text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-2 left-2 px-2 py-1 bg-surface/90 rounded text-[10px] uppercase font-bold text-text-main shadow-sm">
              {item.type}
            </div>
          </div>
        ))}
        {(!media || media.length === 0) && (
          <div className="col-span-full py-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-text-light text-sm bg-gray-50 dark:bg-slate-800">
            No media uploaded. Add images or PDFs.
          </div>
        )}
      </div>
    </div>
  );
}

function EventForm({
  event,
  availableTags,
  onRefreshTags,
  onSave
}: {
  event: AdminEvent;
  availableTags: string[];
  onRefreshTags: () => void;
  onSave: (event: AdminEvent, publish?: boolean) => void;
}) {
  const [formData, setFormData] = useState<AdminEvent>(event);
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'time'>('details');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setFormData(event);
  }, [event]);

  const updateField = <K extends keyof AdminEvent>(field: K, value: AdminEvent[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addDetail = () => {
    updateField('details', [...(formData.details || []), '']);
  };

  const updateDetail = (index: number, value: string) => {
    const details = [...(formData.details || [])];
    details[index] = value;
    updateField('details', details);
  };

  const removeDetail = (index: number) => {
    const details = [...(formData.details || [])];
    details.splice(index, 1);
    updateField('details', details);
  };

  const addMeta = () => {
    updateField('meta', [...(formData.meta || []), { label: '', value: '' }]);
  };

  const updateMeta = (index: number, field: 'label' | 'value', value: string) => {
    const meta = [...(formData.meta || [])];
    meta[index] = { ...meta[index], [field]: value };
    updateField('meta', meta);
  };

  const removeMeta = (index: number) => {
    const meta = [...(formData.meta || [])];
    meta.splice(index, 1);
    updateField('meta', meta);
  };

  const handleAddNewTag = async () => {
      if (!newTag.trim()) return;
      await eventService.saveTag(newTag.trim());
      onRefreshTags();
      setNewTag('');
  };

  const toggleDayOfWeek = (day: number) => {
    const days = formData.daysOfWeek || [];
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day];
    updateField('daysOfWeek', newDays);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Form Header */}
        <div className="px-4 md:px-6 py-4 border-b border-border bg-gray-50 dark:bg-slate-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-text-main">
                 {event.id.startsWith('event-') ? 'New Event' : 'Edit Event'}
                 {formData.highlight && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
              </h2>
            </div>
          </div>
          <div className="flex gap-3">
             {/* Mobile: Just save icon. Desktop: Full button */}
             <button
              onClick={() => onSave(formData, false)}
              className="px-4 py-2 bg-surface hover:bg-gray-50 dark:hover:bg-slate-700 border border-border hover:border-gray-300 dark:hover:border-gray-600 rounded-full text-sm font-bold transition-all duration-300 text-text-main shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm flex items-center gap-2"
              title="Save Draft"
            >
              <Check className="w-4 h-4" />
              <span className="hidden md:inline">Save Draft</span>
            </button>
            <button
              onClick={() => onSave(formData, true)}
              className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-green-900/20 hover:shadow-green-900/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm ring-1 ring-white/20"
            >
               <Globe className="w-4 h-4" />
              <span className="hidden md:inline">Publish Live</span>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-8">
          {/* Title & Basic Info */}
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-1">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-ballys-red focus:ring-1 focus:ring-ballys-red text-lg md:text-xl font-bold placeholder:text-text-light/50 transition-all text-text-main"
                  placeholder="Enter event name..."
                />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-1">Category</label>
                    <div className="relative">
                        <select
                        value={formData.category}
                        onChange={(e) => updateField('category', e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-text-main"
                        >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        </select>
                        <div className="absolute right-3 top-3 pointer-events-none text-text-light">
                            <ArrowUpDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-1">Property</label>
                     <div className="relative">
                        <select
                        value={formData.property || 'Both'}
                        onChange={(e) => updateField('property', e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-text-main"
                        >
                        <option value="Both">Both Properties</option>
                        <option value="Lincoln">Bally's Lincoln</option>
                        <option value="Tiverton">Bally's Tiverton</option>
                        </select>
                         <div className="absolute right-3 top-3 pointer-events-none text-text-light">
                            <ArrowUpDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div className="flex items-end pb-1">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.highlight ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300 dark:border-gray-600 bg-surface group-hover:border-gray-400'}`}>
                             {formData.highlight && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={formData.highlight || false}
                            onChange={(e) => updateField('highlight', e.target.checked)}
                            className="hidden"
                        />
                        <span className={`text-sm font-medium transition-colors ${formData.highlight ? 'text-yellow-600' : 'text-text-muted group-hover:text-text-main'}`}>
                            Featured Event
                        </span>
                    </label>
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-ballys-red resize-none text-text-main leading-relaxed placeholder:text-text-light/50"
                  placeholder="Write a brief description..."
                />
             </div>
          </div>

          {/* Tabs for other sections */}
          <div className="border-t border-border pt-6">
             <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg inline-flex border border-border w-full md:w-auto overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'details' ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                    Details & Media
                </button>
                 <button 
                    onClick={() => setActiveTab('time')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'time' ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                    Date & Time
                </button>
             </div>

             <AnimatePresence mode="wait">
                {activeTab === 'details' ? (
                    <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Media */}
                         <div className="bg-gray-50 dark:bg-slate-800 border border-border rounded-xl p-5">
                            <MediaUpload
                                media={formData.media}
                                onChange={(media) => updateField('media', media)}
                            />
                        </div>

                        {/* Bullet Points */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-light">Bullet Points</label>
                                <button onClick={addDetail} className="text-xs text-ballys-red hover:text-ballys-darkRed font-medium flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Point
                                </button>
                            </div>
                             <div className="space-y-2">
                                {formData.details?.map((detail, index) => (
                                <div key={index} className="flex gap-2 group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-4 shrink-0 group-hover:bg-ballys-red transition-colors" />
                                    <input
                                    type="text"
                                    value={detail}
                                    onChange={(e) => updateDetail(index, e.target.value)}
                                    className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                                    placeholder="Detail point"
                                    />
                                    <button
                                    onClick={() => removeDetail(index)}
                                    className="p-2 text-text-light hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                    <X className="w-4 h-4" />
                                    </button>
                                </div>
                                ))}
                                {(!formData.details || formData.details.length === 0) && (
                                    <div onClick={addDetail} className="px-4 py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                        <p className="text-sm text-text-light">No details added. Click to add bullet points.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                         {/* Meta */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-light">Meta Info (Tags)</label>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="text" 
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            className="px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-border rounded text-xs focus:outline-none focus:border-ballys-red text-text-main w-20 md:w-auto"
                                            placeholder="New Tag"
                                        />
                                        <button onClick={handleAddNewTag} disabled={!newTag.trim()} className="text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-2 py-1 rounded text-text-main disabled:opacity-50">
                                            Save
                                        </button>
                                    </div>
                                    <button onClick={addMeta} className="text-xs text-ballys-red hover:text-ballys-darkRed font-medium flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add
                                    </button>
                                </div>
                            </div>

                            {/* Quick Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['VIP', 'PROMO', 'DINING', 'MUSIC', 'LOCATION', 'TIME', 'PRICE', 'AGES'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            // Add tag if not already present as a label? Or just add a new row with this label
                                            updateField('meta', [...(formData.meta || []), { label: tag, value: '' }]);
                                        }}
                                        className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${
                                            tag === 'VIP' ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                                            tag === 'PROMO' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                                            tag === 'DINING' ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' :
                                            tag === 'MUSIC' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                            'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                             <div className="space-y-2">
                                {formData.meta?.map((meta, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <div className="w-1/3 relative">
                                        <input
                                            type="text"
                                            value={meta.label}
                                            onChange={(e) => updateMeta(index, 'label', e.target.value)}
                                            className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-xs font-bold uppercase tracking-wider text-text-muted"
                                            placeholder="LABEL"
                                            list="available-tags"
                                        />
                                        <datalist id="available-tags">
                                            {availableTags.map(tag => (
                                                <option key={tag} value={tag} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <input
                                    type="text"
                                    value={meta.value}
                                    onChange={(e) => updateMeta(index, 'value', e.target.value)}
                                    className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                                    placeholder="Value"
                                    />
                                    <button
                                    onClick={() => removeMeta(index)}
                                    className="p-2 text-text-light hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                    <X className="w-4 h-4" />
                                    </button>
                                </div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                ) : (
                    <motion.div
                        key="time"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-surface border border-border rounded-xl p-4 md:p-6"
                    >
                         <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-border">
                            <input
                                type="checkbox"
                                id="recurring"
                                checked={formData.isRecurring || false}
                                onChange={(e) => updateField('isRecurring', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-black focus:ring-black bg-white dark:bg-slate-700"
                            />
                            <label htmlFor="recurring" className="text-sm font-medium cursor-pointer flex-1">
                                <span className="block text-text-main">Recurring Event</span>
                                <span className="block text-xs text-text-muted">Repeats weekly on specific days</span>
                            </label>
                            </div>

                            {formData.isRecurring ? (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-3">Active Days</label>
                                <div className="flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map((day, index) => (
                                    <button
                                    key={index}
                                    type="button"
                                    onClick={() => toggleDayOfWeek(index)}
                                    className={`h-10 px-4 rounded-lg border text-sm font-medium transition-all ${formData.daysOfWeek?.includes(index)
                                        ? 'bg-ballys-red border-ballys-red text-white shadow-md'
                                        : 'bg-surface border-border text-text-muted hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-text-main'
                                        }`}
                                    >
                                    {day.slice(0, 3)}
                                    </button>
                                ))}
                                </div>
                            </div>
                            ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={(e) => updateField('startDate', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                                />
                                </div>
                                <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={(e) => updateField('endDate', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                                />
                                </div>
                            </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-2">Start Time</label>
                                    <input
                                    type="time"
                                    value={formData.startTime || '00:00'}
                                    onChange={(e) => updateField('startTime', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-2">End Time</label>
                                    <input
                                    type="time"
                                    value={formData.endTime || '23:59'}
                                    onChange={(e) => updateField('endTime', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-text-main"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>

          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BulkUploadForm({
  json,
  onChange,
  onUpload,
  onCancel
}: {
  json: string;
  onChange: (value: string) => void;
  onUpload: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-main">Bulk Upload Events</h2>
            <p className="text-sm text-text-muted mt-1">Paste JSON array of events to upload</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg border border-border transition-colors text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-text-main">JSON Data</label>
            <textarea
              value={json}
              onChange={(e) => onChange(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-border rounded-lg focus:outline-none focus:border-ballys-red resize-none font-mono text-sm text-text-main"
              placeholder='Paste "Full Backup" JSON object OR list of events: [{"id": "...", ...}]'
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-400">
              <p className="font-medium mb-1">Supported Formats:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-300">
                <li><strong>Full Backup:</strong> Restore events, schedules, and tags (replaces current data)</li>
                <li><strong>Event List:</strong> Import/Update specific events (merges with current data)</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border rounded-lg text-sm transition-colors text-text-main"
            >
              Cancel
            </button>
            <button
              onClick={onUpload}
              className="px-4 py-2 bg-ballys-red hover:bg-ballys-darkRed rounded-lg text-sm font-medium flex items-center gap-2 transition-colors text-white shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload & Publish
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full text-center"
    >
      <div className="bg-surface border border-border rounded-2xl p-12 max-w-md shadow-sm">
        <Settings className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2 text-text-main">No Event Selected</h3>
        <p className="text-text-muted text-sm">
          Select an event from the list to edit, or create a new event to get started.
        </p>
      </div>
    </motion.div>
  );
}
