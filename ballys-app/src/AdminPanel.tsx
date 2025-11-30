import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Upload, Download,
  AlertCircle, FileText, Star, Settings, Check, Database, Globe, Eye, ArrowUpDown, ChevronLeft, Search, Calendar as CalendarIcon, List
} from 'lucide-react';
import type { AdminEvent, ScheduleItem } from './types';
import { getDefaultPromotions } from './data';
import { eventService } from './services/eventService';
import Dashboard from './Dashboard';
import BigCalendar from './components/Calendar/BigCalendar';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['Invited', 'Open', 'Dining', 'Promo', 'Internal', 'Schedule', 'Entertainment'] as const;

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  // Local state (working copy)
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [schedules, setSchedules] = useState<Record<string, ScheduleItem[]>>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
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
  const [activeView, setActiveView] = useState<'events' | 'schedules'>('events');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewEditId, setPreviewEditId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'last-edited' | 'property'>('date-desc');
  const [eventsViewMode, setEventsViewMode] = useState<'list' | 'calendar'>('list');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    const loadedEvents = await eventService.getEvents();
    const loadedSchedules = await eventService.getSchedules();
    const loadedTags = await eventService.getTags();
    
    setEvents(loadedEvents);
    setSavedEvents(JSON.parse(JSON.stringify(loadedEvents))); // Deep copy
    
    setSchedules(loadedSchedules);
    setSavedSchedules(JSON.parse(JSON.stringify(loadedSchedules))); // Deep copy

    setAvailableTags(loadedTags);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshTags = async () => {
      const tags = await eventService.getTags();
      setAvailableTags(tags);
  };

  const initializeWithDefaults = async () => {
    const defaultPromotions = getDefaultPromotions();
    setEvents(defaultPromotions);
    showToast('Default promotions loaded. Click "Publish All" to save to live site.');
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
      property: 'Both'
    };
    setEvents([...events, newEvent]);
    setEditingId(newEvent.id);
    setShowAddForm(true);
    setShowBulkUpload(false);
    setActiveView('events');
    // Reset category filter if new event is hidden by it
    if (filterCategory !== 'all' && filterCategory !== newEvent.category) {
      setFilterCategory('all');
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowAddForm(true);
    setShowBulkUpload(false);
    setActiveView('events');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(e => e.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setShowAddForm(false);
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedEvents.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedEvents.size} event(s)?`)) {
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

    const updated = editingId
      ? events.map(e => e.id === editingId ? eventToSave : e)
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

  const handleBulkUpload = () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        alert('JSON must be an array of events');
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
      alert('Invalid JSON format');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ballys-events-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <div className="fixed inset-0 z-[100] bg-background text-text-main overflow-hidden font-sans">
      {/* Preview Mode Overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm">
          <div className="sticky top-0 z-[210] bg-ballys-red text-white px-4 py-2 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Eye className="w-4 h-4" />
              PREVIEW MODE (Unsaved Changes Visible)
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
            >
              Exit Preview
            </button>
          </div>
          <div className="h-[calc(100vh-40px)] overflow-y-auto">
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
                                    onCancel={() => setPreviewEditId(null)}
                                />
                            );
                        })()}
                    </div>
                </div>
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Settings className="w-6 h-6 text-ballys-red" />
              <div>
                <h1 className="text-xl font-bold text-text-main">Admin Panel</h1>
                <p className="text-xs text-text-muted">Manage Events & Schedules</p>
              </div>
            </div>
            
            {/* Center Actions */}
            <div className="flex-1 flex justify-center gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-2.5 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border rounded-full text-sm font-bold flex items-center gap-2 transition-colors shadow-sm text-text-main"
                title="Preview changes as they would appear on the live site"
              >
                <Eye className="w-4 h-4 text-text-muted" />
                Preview Site
              </button>
              
               <button
                onClick={handlePublishAll}
                className={`px-8 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${
                  hasUnsavedChanges()
                    ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105 shadow-green-500/20'
                    : 'bg-gray-100 dark:bg-slate-800 text-text-muted cursor-default border border-border'
                }`}
              >
                <Globe className="w-4 h-4" />
                {hasUnsavedChanges() ? 'Publish All Changes' : 'All Changes Published'}
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 mr-4">
               <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-lg flex mr-4 border border-border">
                  <button
                    onClick={() => setEventsViewMode('list')}
                    className={`p-2 rounded-md transition-all ${eventsViewMode === 'list' ? 'bg-surface shadow-sm text-ballys-red' : 'text-text-muted hover:text-text-main'}`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                   <button
                    onClick={() => setEventsViewMode('calendar')}
                    className={`p-2 rounded-md transition-all ${eventsViewMode === 'calendar' ? 'bg-surface shadow-sm text-ballys-red' : 'text-text-muted hover:text-text-main'}`}
                     title="Calendar View"
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>
               </div>

              <button
                onClick={() => setActiveView('events')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'events'
                  ? 'bg-ballys-red text-white shadow-md'
                  : 'bg-surface border border-border text-text-muted hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveView('schedules')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'schedules'
                  ? 'bg-ballys-red text-white shadow-md'
                  : 'bg-surface border border-border text-text-muted hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
              >
                Schedules
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  if (confirm('Initialize database tables? This is safe to run if tables already exist.')) {
                    try {
                      await eventService.initDatabase();
                      showToast('Database initialized successfully!');
                    } catch (e) {
                      alert('Failed to initialize database. Check console for errors.');
                    }
                  }
                }}
                className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 rounded-lg flex items-center gap-2 text-sm transition-colors"
                title="Create database tables if missing"
              >
                <Database className="w-4 h-4" />
                Init DB
              </button>
              <button
                onClick={() => {
                  if (confirm('This will replace all current events with default promotions. Continue?')) {
                    initializeWithDefaults();
                  }
                }}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg flex items-center gap-2 text-sm transition-colors"
                title="Load default promotions"
              >
                <Settings className="w-4 h-4" />
                Load Defaults
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border text-text-main rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-ballys-red hover:bg-ballys-darkRed text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-md"
              >
                <X className="w-4 h-4" />
                Back to Site
              </button>
              <button
                onClick={() => {
                    if (confirm('Are you sure you want to log out?')) {
                        localStorage.removeItem('ballys_auth');
                        localStorage.removeItem('ballys_auth_time');
                        window.location.reload();
                    }
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-text-muted rounded-lg text-xs font-medium transition-colors"
                title="Log Out"
              >
                Log Out
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-96 border-r border-border bg-surface/60 backdrop-blur-xl overflow-y-auto scroll-smooth overscroll-contain">
            {activeView === 'events' ? (
              <div className="p-4 space-y-4">
                {/* Search & Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-text-light absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search title, details, tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 pl-9 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red focus:ring-1 focus:ring-ballys-red text-sm text-text-main placeholder:text-text-light"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-2.5 text-text-light hover:text-text-main transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-sm text-text-main"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="w-full px-4 py-2.5 pl-9 bg-surface border border-border rounded-lg focus:outline-none focus:border-ballys-red text-sm appearance-none cursor-pointer text-text-main"
                      >
                        <option value="date-desc">Newest Date</option>
                        <option value="date-asc">Oldest Date</option>
                        <option value="last-edited">Last Edited</option>
                        <option value="property">Property</option>
                      </select>
                      <ArrowUpDown className="w-4 h-4 text-text-light absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedEvents.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center justify-between"
                  >
                    <span className="text-sm text-red-800 dark:text-red-400">{selectedEvents.size} selected</span>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded text-sm flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAdd()}
                    className="flex-1 px-4 py-2.5 bg-ballys-red hover:bg-ballys-darkRed rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors text-white shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkUpload(true);
                      setShowAddForm(false);
                      setEditingId(null);
                    }}
                    className="px-4 py-2.5 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border rounded-lg flex items-center gap-2 text-sm transition-colors text-text-main"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>

                {/* Event List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs text-text-light uppercase tracking-wider">
                      Events ({filteredEvents.length})
                    </span>
                    {filteredEvents.length > 0 && (
                      <button
                        onClick={toggleSelectAll}
                        className="text-xs text-text-light hover:text-text-main transition-colors"
                      >
                        {selectedEvents.size === filteredEvents.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-text-light text-sm border border-dashed border-border rounded-lg bg-gray-50 dark:bg-slate-800">
                      No events found
                    </div>
                  ) : (
                    filteredEvents.map(event => {
                      const status = getEventStatus(event);
                      return (
                        <div
                          key={event.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${editingId === event.id
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-sm'
                            : 'bg-surface border-border hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600'
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
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                    event.isRecurring 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                }`}>
                                    {event.isRecurring 
                                        ? (event.daysOfWeek && event.daysOfWeek.length > 0 
                                            ? event.daysOfWeek.map(d => DAYS_OF_WEEK[d].slice(0, 3)).join(', ') 
                                            : 'Weekly')
                                        : (event.startDate ? new Date(event.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date')
                                    }
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-text-muted border border-border">
                                  {event.category}
                                </span>
                                {status !== 'synced' && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                    status === 'new' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30'
                                  }`}>
                                    {status === 'new' ? 'New' : 'Edited'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(event.id);
                              }}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-text-light hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Schedule Categories</h3>
                  <button
                    onClick={() => {
                      const name = prompt('Enter category name:');
                      if (name) addScheduleCategory(name);
                    }}
                    className="px-3 py-1.5 bg-ballys-red hover:bg-ballys-darkRed rounded-lg text-xs font-medium flex items-center gap-2 transition-colors text-white shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Add Category
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
                          : 'bg-surface border-border hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600'
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
                             {status !== 'synced' && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                  status === 'new' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30'
                                }`}>
                                  {status === 'new' ? 'New' : 'Edited'}
                                </span>
                              )}
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

          {/* Main Content - Edit Form */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth overscroll-contain bg-gray-50/50 dark:bg-slate-950/50">
            {eventsViewMode === 'calendar' && activeView === 'events' ? (
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                         <div>
                            <h2 className="text-2xl font-bold text-text-main">Calendar Management</h2>
                            <p className="text-sm text-text-muted">Drag to select days, click to edit events.</p>
                        </div>
                        <button
                            onClick={() => handleAdd()}
                            className="px-4 py-2.5 bg-ballys-red hover:bg-ballys-darkRed rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors text-white shadow-md"
                        >
                            <Plus className="w-4 h-4" />
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
              {activeView === 'events' ? (
                showAddForm && currentEvent ? (
                  <EventForm
                    key={editingId}
                    event={currentEvent}
                    availableTags={availableTags}
                    onRefreshTags={refreshTags}
                    onSave={handleSaveEvent}
                    onCancel={() => {
                      setEditingId(null);
                      setShowAddForm(false);
                    }}
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
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-surface border border-border rounded-2xl p-12 max-w-md shadow-sm">
                    <Settings className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-text-main">No Category Selected</h3>
                    <p className="text-text-muted text-sm">
                      Select a schedule category from the sidebar to edit, or create a new one.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
            )}
          </div>
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
  onDeleteCategory,
  onCancel
}: {
  category: string;
  items: ScheduleItem[];
  onUpdate: (items: ScheduleItem[]) => void;
  onDeleteCategory: () => void;
  onCancel: () => void;
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

  const handleExport = () => {
    const dataStr = JSON.stringify(localItems, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.toLowerCase().replace(/\s+/g, '-')}-schedule.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            setLocalItems(json);
          } else {
            alert('Invalid JSON format: Must be an array of schedule items');
          }
        } catch (err) {
          alert('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
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
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-main">{category}</h2>
            <p className="text-sm text-text-muted mt-1">Edit hours and locations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border rounded-lg text-sm flex items-center gap-2 transition-colors text-text-main"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-2 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border rounded-lg text-sm flex items-center gap-2 transition-colors text-text-main"
              title="Import JSON"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-ballys-red/10 hover:bg-ballys-red/20 border border-ballys-red/20 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors text-ballys-red"
            >
              <Check className="w-4 h-4" />
              Save Draft
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onDeleteCategory}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm transition-colors"
          >
            Delete Category
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border rounded-lg text-sm transition-colors text-text-main"
          >
            Back
          </button>
        </div>


        <div className="space-y-4">
          {localItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-center bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-border">
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
                className="p-2 bg-surface hover:bg-red-50 dark:hover:bg-red-900/20 border border-border hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-colors text-text-light hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="w-full px-4 py-3 bg-surface hover:bg-gray-50 dark:hover:bg-slate-800 border border-border border-dashed rounded-lg flex items-center justify-center gap-2 text-sm transition-colors text-text-muted hover:text-text-main"
          >
            <Plus className="w-4 h-4" />
            Add Item
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
  onSave,
  onCancel
}: {
  event: AdminEvent;
  availableTags: string[];
  onRefreshTags: () => void;
  onSave: (event: AdminEvent, publish?: boolean) => void;
  onCancel: () => void;
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
        <div className="px-6 py-4 border-b border-border bg-gray-50 dark:bg-slate-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-4">
             <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-text-muted"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-text-main">
                 {event.id.startsWith('event-') ? 'Create New Event' : 'Edit Event'}
                 {formData.highlight && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
              </h2>
              <p className="text-xs text-text-muted">
                {formData.title || 'Untitled Event'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSave(formData, false)}
              className="px-4 py-2 bg-surface hover:bg-gray-50 dark:hover:bg-slate-700 border border-border rounded-lg text-sm font-medium transition-colors text-text-main shadow-sm"
            >
              Save Draft
            </button>
            <button
              onClick={() => onSave(formData, true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-md"
            >
              <Globe className="w-4 h-4" />
              Save & Publish
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Title & Basic Info */}
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-light mb-1">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-ballys-red focus:ring-1 focus:ring-ballys-red text-xl font-bold placeholder:text-text-light/50 transition-all text-text-main"
                  placeholder="Enter event name..."
                  autoFocus
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
             <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg inline-flex border border-border">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'details' ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                    Details & Media
                </button>
                 <button 
                    onClick={() => setActiveTab('time')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'time' ? 'bg-surface text-text-main shadow-sm' : 'text-text-muted hover:text-text-main'}`}
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
                                            className="px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-border rounded text-xs focus:outline-none focus:border-ballys-red text-text-main"
                                            placeholder="New Tag Name"
                                        />
                                        <button onClick={handleAddNewTag} disabled={!newTag.trim()} className="text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 px-2 py-1 rounded text-text-main disabled:opacity-50">
                                            Save Tag
                                        </button>
                                    </div>
                                    <button onClick={addMeta} className="text-xs text-ballys-red hover:text-ballys-darkRed font-medium flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add Tag
                                    </button>
                                </div>
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
                        className="bg-surface border border-border rounded-xl p-6"
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
                                    {day}
                                    </button>
                                ))}
                                </div>
                            </div>
                            ) : (
                            <div className="grid grid-cols-2 gap-6">
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
              placeholder='[{"id": "event-1", "title": "Event Title", "category": "Open", ...}]'
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-400">
              <p className="font-medium mb-1">Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-300">
                <li>Must be a valid JSON array</li>
                <li>Each event must have an "id" and "title"</li>
                <li>Events with existing IDs will be updated</li>
                <li>New events will be added</li>
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
          Select an event from the sidebar to edit, or create a new event to get started.
        </p>
      </div>
    </motion.div>
  );
}
