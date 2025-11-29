import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Save, Upload, Download, Calendar,
  AlertCircle, FileText, Tag, Star, Settings, Check, Database
} from 'lucide-react';
import type { AdminEvent, ScheduleItem } from './types';
import { getDefaultPromotions } from './data';
import { eventService } from './services/eventService';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['Invited', 'Open', 'Dining', 'Promo', 'Internal', 'Schedule', 'Entertainment'] as const;

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [schedules, setSchedules] = useState<Record<string, ScheduleItem[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [activeView, setActiveView] = useState<'events' | 'schedules'>('events');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    loadSchedules();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadEvents = async () => {
    const loadedEvents = await eventService.getEvents();
    setEvents(loadedEvents);
  };

  const initializeWithDefaults = async () => {
    const defaultPromotions = getDefaultPromotions();
    setEvents(defaultPromotions);
    await eventService.saveEvents(defaultPromotions);
  };

  const loadSchedules = async () => {
    const loadedSchedules = await eventService.getSchedules();
    setSchedules(loadedSchedules);
  };

  const saveSchedules = async (schedulesToSave: Record<string, ScheduleItem[]>) => {
    try {
      await eventService.saveSchedules(schedulesToSave);
      setSchedules(schedulesToSave);
      showToast('Schedules published successfully to live site!');
    } catch (e) {
      console.error('Failed to save schedules:', e);
      alert('Failed to save schedules. Please try again.');
    }
  };


  const addScheduleCategory = (categoryName: string) => {
    const updated = { ...schedules, [categoryName]: [] };
    saveSchedules(updated);
  };

  const removeScheduleCategory = (category: string) => {
    const updated = { ...schedules };
    delete updated[category];
    saveSchedules(updated);
  };

  const saveEvents = async (eventsToSave: AdminEvent[]) => {
    try {
      // Validate events before saving
      const validEvents = eventsToSave.filter(e => e.id && e.title);
      await eventService.saveEvents(validEvents);
      setEvents(validEvents);
      showToast('Events published successfully to live site!');
    } catch (e) {
      console.error('Failed to save events:', e);
      alert('Failed to save events. Please try again.');
    }
  };

  const handleAdd = () => {
    const newEvent: AdminEvent = {
      id: `event-${Date.now()}`,
      title: '',
      category: 'Open',
      description: '',
      details: [],
      meta: [],
      highlight: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '00:00',
      endTime: '23:59',
      daysOfWeek: [],
      isRecurring: false,
    };
    setEvents([...events, newEvent]);
    setEditingId(newEvent.id);
    setShowAddForm(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      saveEvents(events.filter(e => e.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setShowAddForm(false);
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedEvents.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedEvents.size} event(s)?`)) {
      saveEvents(events.filter(e => !selectedEvents.has(e.id)));
      setSelectedEvents(new Set());
    }
  };

  const handleSave = (eventData: AdminEvent) => {
    if (!eventData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    const updated = editingId
      ? events.map(e => e.id === editingId ? eventData : e)
      : [...events, eventData];

    saveEvents(updated);
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

      saveEvents(updatedEvents);
      setBulkJson('');
      setShowBulkUpload(false);
      alert(`Successfully uploaded ${validEvents.length} event(s)`);
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
    return events.filter(e => {
      const matchesSearch = !searchTerm ||
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredEvents = getFilteredEvents();

  const currentEvent = editingId ? events.find(e => e.id === editingId) : null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-900/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Settings className="w-6 h-6 text-red-500" />
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-xs text-white/50">Manage Events & Schedules</p>
              </div>
            </div>
            {/* View Toggle */}
            <div className="flex gap-2 mr-4">
              <button
                onClick={() => setActiveView('events')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'events'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveView('schedules')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'schedules'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
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
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg flex items-center gap-2 text-sm transition-colors"
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
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg flex items-center gap-2 text-sm transition-colors"
                title="Load default promotions"
              >
                <Settings className="w-4 h-4" />
                Load Defaults
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-96 border-r border-white/10 bg-[#050505]/50 backdrop-blur-xl overflow-y-auto scroll-smooth overscroll-contain">
            {activeView === 'events' ? (
              <div className="p-4 space-y-4">
                {/* Search & Filters */}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50 text-sm"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Bulk Actions */}
                {selectedEvents.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between"
                  >
                    <span className="text-sm">{selectedEvents.size} selected</span>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-sm flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </button>
                  <button
                    onClick={() => setShowBulkUpload(true)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-2 text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>

                {/* Event List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                      Events ({filteredEvents.length})
                    </span>
                    {filteredEvents.length > 0 && (
                      <button
                        onClick={toggleSelectAll}
                        className="text-xs text-white/50 hover:text-white transition-colors"
                      >
                        {selectedEvents.size === filteredEvents.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-white/30 text-sm">
                      No events found
                    </div>
                  ) : (
                    filteredEvents.map(event => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${editingId === event.id
                          ? 'bg-red-500/20 border-red-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                        onClick={() => handleEdit(event.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedEvents.has(event.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(event.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{event.title || 'Untitled'}</h3>
                              {event.highlight && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60">
                                {event.category}
                              </span>
                              {event.isRecurring && (
                                <span className="text-xs px-2 py-0.5 bg-blue-500/20 rounded text-blue-400">
                                  Recurring
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(event.id);
                            }}
                            className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-white/40" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Schedule Categories</h3>
                  <button
                    onClick={() => {
                      const name = prompt('Enter category name:');
                      if (name) addScheduleCategory(name);
                    }}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Category
                  </button>
                </div>
                <div className="space-y-2">
                  {Object.keys(schedules).map((category) => (
                    <div
                      key={category}
                      onClick={() => setEditingId(category)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${editingId === category
                        ? 'bg-red-500/20 border-red-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{category}</h4>
                        <span className="text-xs text-white/50">{schedules[category].length} items</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Edit Form */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth overscroll-contain">
            <AnimatePresence mode="wait">
              {activeView === 'events' ? (
                showAddForm && currentEvent ? (
                  <EventForm
                    key={editingId}
                    event={currentEvent}
                    onSave={handleSave}
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
                    saveSchedules(updated);
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
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 max-w-md">
                    <Settings className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Category Selected</h3>
                    <p className="text-white/50 text-sm">
                      Select a schedule category from the sidebar to edit, or create a new one.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[200] bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-green-400/50"
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{category}</h2>
            <p className="text-sm text-white/50 mt-1">Edit hours and locations</p>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Publish Changes
          </button>
          <button
            onClick={onDeleteCategory}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm transition-colors"
          >
            Delete Category
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
          >
            Back
          </button>
        </div>


        <div className="space-y-4">
          {localItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-center bg-white/5 p-4 rounded-lg border border-white/10">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
                placeholder="Location name"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
              />
              <input
                type="text"
                value={item.time}
                onChange={(e) => updateItem(index, 'time', e.target.value)}
                placeholder="Hours (e.g., 10am – 10pm)"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
              />
              <button
                onClick={() => removeItem(index)}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>
    </motion.div >
  );
}

function EventForm({
  event,
  onSave,
  onCancel
}: {
  event: AdminEvent;
  onSave: (event: AdminEvent) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<AdminEvent>(event);

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
    updateField('details', formData.details?.filter((_, i) => i !== index) || []);
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
    updateField('meta', formData.meta?.filter((_, i) => i !== index) || []);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Event</h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save & Publish
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Basic Information
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                placeholder="Event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value as any)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50 resize-none"
                placeholder="Event description"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="highlight"
                checked={formData.highlight || false}
                onChange={(e) => updateField('highlight', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5"
              />
              <label htmlFor="highlight" className="text-sm flex items-center gap-2 cursor-pointer">
                <Star className="w-4 h-4 text-yellow-500" />
                Featured Event
              </label>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.isRecurring || false}
                onChange={(e) => updateField('isRecurring', e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5"
              />
              <label htmlFor="recurring" className="text-sm cursor-pointer">
                Recurring Event (by day of week)
              </label>
            </div>

            {formData.isRecurring ? (
              <div>
                <label className="block text-sm font-medium mb-2">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDayOfWeek(index)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${formData.daysOfWeek?.includes(index)
                        ? 'bg-red-500/20 border-red-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime || '00:00'}
                      onChange={(e) => updateField('startTime', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime || '23:59'}
                      onChange={(e) => updateField('endTime', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => updateField('endDate', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime || '00:00'}
                    onChange={(e) => updateField('startTime', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime || '23:59'}
                    onChange={(e) => updateField('endTime', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details (Bullet Points) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                Details (Bullet Points)
              </h3>
              <button
                onClick={addDetail}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.details?.map((detail, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={detail}
                  onChange={(e) => updateDetail(index, e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                  placeholder="Detail point"
                />
                <button
                  onClick={() => removeDetail(index)}
                  className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!formData.details || formData.details.length === 0) && (
              <p className="text-sm text-white/30 italic">No details added</p>
            )}
          </div>

          {/* Meta (Key-Value Pairs) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Meta Information (WHEN, WHERE, etc.)
              </h3>
              <button
                onClick={addMeta}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.meta?.map((meta, index) => (
              <div key={index} className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={meta.label}
                  onChange={(e) => updateMeta(index, 'label', e.target.value)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                  placeholder="Label (e.g., WHEN)"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={meta.value}
                    onChange={(e) => updateMeta(index, 'value', e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50"
                    placeholder="Value"
                  />
                  <button
                    onClick={() => removeMeta(index)}
                    className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {(!formData.meta || formData.meta.length === 0) && (
              <p className="text-sm text-white/30 italic">No meta information added</p>
            )}
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bulk Upload Events</h2>
            <p className="text-sm text-white/50 mt-1">Paste JSON array of events to upload</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">JSON Data</label>
            <textarea
              value={json}
              onChange={(e) => onChange(e.target.value)}
              rows={15}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50 resize-none font-mono text-sm"
              placeholder='[{"id": "event-1", "title": "Event Title", "category": "Open", ...}]'
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-white/70">
              <p className="font-medium mb-1">Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-white/50">
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
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onUpload}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 max-w-md">
        <Settings className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No Event Selected</h3>
        <p className="text-white/50 text-sm">
          Select an event from the sidebar to edit, or create a new event to get started.
        </p>
      </div>
    </motion.div>
  );
}

