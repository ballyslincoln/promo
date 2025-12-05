import { useState, useEffect, useCallback } from 'react';
import { dropSheetService } from '../../services/dropSheetService';
import { analyticsService } from '../../services/analyticsService';
import type { MailJob } from '../../services/dropSheetService';
import JobCard from './JobCard';
import AddJobModal from './AddJobModal';
import ImportJsonModal from './ImportJsonModal';
import ExportJsonModal from './ExportJsonModal';
import ShortcutsHelp from './ShortcutsHelp';
import { ThemeToggle } from '../ThemeToggle';
import { Plus, Upload, ArrowLeft, ChevronLeft, ChevronRight, Trash2, AlertTriangle, ListChecks, ArrowUpDown, X, Keyboard, Users, Search } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth, parseISO, isValid } from 'date-fns';
import { calculateMilestoneDates } from './dateUtils';

import Footer from '../Footer';

interface DropSheetProps {
    onBack: () => void;
}

export default function DropSheet({ onBack }: DropSheetProps) {
    const [jobs, setJobs] = useState<MailJob[]>([]);
    const [propertyFilter, setPropertyFilter] = useState<'All' | 'Lincoln' | 'Tiverton'>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date()); // Default to today (which will be Jan 2026 or current real time)
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [activeUsers, setActiveUsers] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Mass Selection & Delete
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

    // View Mode
    const [viewMode, setViewMode] = useState<'month' | 'all'>('month');

    // Sort Configuration
    const [sortConfig, setSortConfig] = useState<{ field: 'in_home_date' | 'vendor_mail_date' | 'art_submission_due', direction: 'asc' | 'desc' }>({
        field: 'in_home_date',
        direction: 'asc'
    });

    // Active User Tracking
    useEffect(() => {
        const trackPresence = async () => {
            const { total } = await analyticsService.sendHeartbeat('dropsheet');
            if (total) setActiveUsers(total);
        };

        trackPresence();
        const interval = setInterval(trackPresence, 30000);
        return () => clearInterval(interval);
    }, []);

    // View active users logic
    const handleViewActiveUsers = () => {
        // In a real app, this would fetch the list of users. 
        // For now, we'll just show a simple alert or modal.
        // Since the API only returns a count, we can't really show names.
        // But the user asked to "see who is on the dropsheet".
        // I'll add a placeholder for now.
        alert(`There are currently ${activeUsers} users viewing the Marketing Logistics page.`);
    };

    const loadJobs = useCallback(async () => {
        setIsLoading(true);
        const data = await dropSheetService.getJobs();
        setJobs(data);
        setIsLoading(false);
    }, []);

    const handleUpdateJob = async (updatedJob: MailJob) => {
        // Optimistic update
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
        try {
            await dropSheetService.updateJob(updatedJob);
        } catch (e) {
            console.error("Failed to update job", e);
            // Revert on failure by reloading
            loadJobs();
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm('Are you sure you want to delete this job?')) return;
        setJobs(prev => prev.filter(j => j.id !== id));
        try {
            await dropSheetService.deleteJob(id);
        } catch (e) {
            console.error("Failed to delete job", e);
            loadJobs();
        }
    };

    const handleToggleSelect = (id: string, selected: boolean) => {
        const newSelected = new Set(selectedJobIds);
        if (selected) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedJobIds(newSelected);
    };

    const handleMassDelete = useCallback(async () => {
        if (!confirm(`Are you sure you want to delete ${selectedJobIds.size} jobs?`)) return;
        setIsLoading(true);
        
        const ids = Array.from(selectedJobIds);
        
        // Optimistic update
        setJobs(prev => prev.filter(j => !selectedJobIds.has(j.id)));
        setSelectedJobIds(new Set());
        setIsSelectionMode(false);

        for (const id of ids) {
            try {
                await dropSheetService.deleteJob(id);
            } catch (e) {
                console.error(`Failed to delete job ${id}`, e);
            }
        }
        setIsLoading(false);
    }, [selectedJobIds]);

    const handleAnalyzeDuplicates = useCallback(() => {
        const groups = new Map<string, MailJob[]>();
        
        // Group by Campaign Name + Property + In-Home Date
        jobs.forEach(job => {
            const key = `${job.campaign_name?.trim().toLowerCase()}|${job.property}|${job.in_home_date}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)?.push(job);
        });

        const potentialDuplicates: MailJob[] = [];
        groups.forEach((group) => {
            if (group.length > 1) {
                potentialDuplicates.push(...group);
            }
        });

        if (potentialDuplicates.length === 0) {
            alert("No obvious duplicates found based on Campaign Name, Property, and In-Home Date.");
            return;
        }

        const shouldSelect = confirm(`Found ${potentialDuplicates.length} potential duplicates (Same Name + Property + Date). Switch to selection mode with these highlighted?`);
        if (shouldSelect) {
            setIsSelectionMode(true);
            const ids = new Set<string>();
            potentialDuplicates.forEach(j => ids.add(j.id));
            setSelectedJobIds(ids);
        }
    }, [jobs]);
    
    const handleImportJobs = async (newJobs: MailJob[]) => {
        setIsLoading(true);
        let successCount = 0;
        const errors: string[] = [];
        
        for (const job of newJobs) {
            try {
                // Check existence locally before trying to create to be safe, although UUIDs should be unique
                // The service might handle duplicates if logic exists there, but for now we blindly create
                await dropSheetService.createJob(job);
                successCount++;
            } catch (error) {
                console.error(`Failed to import job ${job.id}:`, error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                errors.push(`Job "${job.campaign_name}": ${errorMessage}`);
            }
        }
        
        await loadJobs();
        setIsLoading(false);
        
        if (errors.length > 0) {
            alert(`Imported ${successCount} jobs successfully.\n\n${errors.length} job(s) failed to import:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...and more' : ''}`);
        } else {
            alert(`Successfully imported ${successCount} job(s)`);
        }
    };

    const handleOpenAddJob = () => {
        setIsAddJobModalOpen(true);
    };

    const handleCreateJob = async (newJob: MailJob) => {
        // Optimistic update
        setJobs(prev => [...prev, newJob]);
        try {
            await dropSheetService.createJob(newJob);
        } catch (e) {
            console.error("Failed to create job", e);
            // Revert on failure by reloading
            loadJobs();
        }
    };

    const handlePrevMonth = useCallback(() => setCurrentMonth(prev => subMonths(prev, 1)), []);
    const handleNextMonth = useCallback(() => setCurrentMonth(prev => addMonths(prev, 1)), []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore shortcuts if user is typing in an input or textarea
            if (
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement
            ) {
                return;
            }

            // Ignore if modal is open (except Escape)
            if (isAddJobModalOpen || isImportModalOpen || isExportModalOpen) {
                if (e.key === 'Escape') {
                     setIsAddJobModalOpen(false);
                     setIsImportModalOpen(false);
                     setIsExportModalOpen(false);
                }
                return;
            }

            // Special handling for Delete/Backspace to allow duplication logic (D) to work separately
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (isSelectionMode && selectedJobIds.size > 0) {
                    handleMassDelete();
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    setIsAddJobModalOpen(true);
                    break;
                case 's':
                    e.preventDefault();
                    setIsSelectionMode(prev => !prev);
                    break;
                case 'd':
                    e.preventDefault();
                    handleAnalyzeDuplicates();
                    break;
                case 'e':
                    e.preventDefault();
                    setIsExportModalOpen(true);
                    break;
                case 'i':
                    e.preventDefault();
                    setIsImportModalOpen(true);
                    break;
                case '?':
                case '/':
                    e.preventDefault();
                    setIsShortcutsOpen(prev => !prev);
                    break;
                case 'arrowleft':
                    handlePrevMonth();
                    break;
                case 'arrowright':
                    handleNextMonth();
                    break;
                case 'escape':
                    if (isShortcutsOpen) setIsShortcutsOpen(false);
                    else if (isSelectionMode) setIsSelectionMode(false);
                    else onBack();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAddJobModalOpen, isImportModalOpen, isExportModalOpen, isSelectionMode, selectedJobIds, isShortcutsOpen, jobs, currentMonth, onBack, handleMassDelete, handleAnalyzeDuplicates, handlePrevMonth, handleNextMonth]); // Added deps for closures

    // Filter jobs by property AND month (using campaign name month or In-Home Date as fallback)
    const filteredJobs = jobs.filter(job => {
        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (
                job.campaign_name?.toLowerCase().includes(query) ||
                job.job_number?.toLowerCase().includes(query) ||
                job.mail_type.toLowerCase().includes(query) ||
                job.tags?.some(tag => tag.toLowerCase().includes(query))
            );
            
            if (!matchesSearch) return false;
        }

        const matchesProperty = propertyFilter === 'All' || job.property === propertyFilter;
        
        if (viewMode === 'all') {
            return matchesProperty;
        }

        // Check if job belongs to current month
        // 1. Try to match campaign name first (e.g. "January Newsletter")
        // 2. Fallback to in_home_date
        let matchesMonth = false;
        
        const monthName = format(currentMonth, 'MMMM').toLowerCase();
        const campaignName = job.campaign_name?.toLowerCase() || '';
        
        if (campaignName.includes(monthName)) {
            // If campaign name explicitly contains the month name, include it
            matchesMonth = true;
        } else if (job.in_home_date) {
            // Fallback to in-home date logic if name doesn't match
            const jobDate = parseISO(job.in_home_date);
            if (isValid(jobDate)) {
                matchesMonth = isSameMonth(jobDate, currentMonth);
            }
        }
        
        return matchesProperty && matchesMonth;
    });

    const sortedFilteredJobs = [...filteredJobs].sort((a, b) => {
        let dateA = 0;
        let dateB = 0;

        if (sortConfig.field === 'art_submission_due') {
            const datesA = calculateMilestoneDates(a.in_home_date, a.mail_type);
            const datesB = calculateMilestoneDates(b.in_home_date, b.mail_type);
            dateA = datesA.artSubmissionDueDate ? datesA.artSubmissionDueDate.getTime() : 0;
            dateB = datesB.artSubmissionDueDate ? datesB.artSubmissionDueDate.getTime() : 0;
        } else {
            dateA = a[sortConfig.field] ? new Date(a[sortConfig.field]).getTime() : 0;
            dateB = b[sortConfig.field] ? new Date(b[sortConfig.field]).getTime() : 0;
        }
        
        if (sortConfig.direction === 'asc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });

    const handleSelectAll = () => {
        if (selectedJobIds.size === sortedFilteredJobs.length && sortedFilteredJobs.length > 0) {
            // Deselect all
            setSelectedJobIds(new Set());
        } else {
            // Select all filtered jobs
            const allIds = new Set(sortedFilteredJobs.map(job => job.id));
            setSelectedJobIds(allIds);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={onBack} className="p-2 hover:bg-surface border border-transparent hover:border-border rounded-xl transition-all group">
                            <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-text-main" />
                        </button>
                        
                        <div className="h-8 w-px bg-border mx-2 hidden md:block" />

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center shadow-sm">
                                <img src="/ballyb.png" className="w-6 h-6 object-contain" alt="Logo" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-text-main tracking-tight">Marketing Logistics</h1>
                                <p className="text-xs text-text-muted font-medium">Campaign Management</p>
                            </div>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative w-full md:w-64 lg:w-80 hidden md:block">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-text-muted" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search campaigns, job #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl leading-5 bg-surface placeholder-text-muted focus:outline-none focus:bg-surface-highlight focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <X className="h-3 w-3 text-text-muted hover:text-text-main" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end bg-surface/50 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm">
                        
                        {/* Live Users Indicator */}
                        <button 
                            onClick={handleViewActiveUsers}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" 
                            title="View Active Users"
                        >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <Users className="w-3.5 h-3.5 text-text-muted" />
                            <span className="text-xs font-bold text-text-main">{activeUsers}</span>
                        </button>

                        <ThemeToggle />
                        
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-surface border border-border rounded-xl p-1 shadow-sm">
                            <button 
                                onClick={() => setViewMode('month')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-gray-800 text-white shadow-md' : 'text-text-muted hover:text-text-main hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                            >
                                Month
                            </button>
                            <button 
                                onClick={() => setViewMode('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'all' ? 'bg-gray-800 text-white shadow-md' : 'text-text-muted hover:text-text-main hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                            >
                                All
                            </button>
                        </div>

                        {/* Month Navigator */}
                        {viewMode === 'month' && (
                            <div className="flex items-center bg-surface border border-border rounded-xl shadow-sm">
                                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-l-xl transition-colors border-r border-border/50">
                                    <ChevronLeft className="w-4 h-4 text-text-muted" />
                                </button>
                                <div className="px-4 min-w-[140px] text-center">
                                    <span className="text-sm font-bold text-text-main block uppercase tracking-wider">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </span>
                                </div>
                                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-r-xl transition-colors border-l border-border/50">
                                    <ChevronRight className="w-4 h-4 text-text-muted" />
                                </button>
                            </div>
                        )}
                        
                        {/* Property Toggle */}
                        <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 shadow-sm">
                             {(['Lincoln', 'Tiverton', 'All'] as const).map((prop) => (
                                <button 
                                    key={prop}
                                    onClick={() => setPropertyFilter(prop)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        propertyFilter === prop 
                                            ? (prop === 'Lincoln' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                            : prop === 'Tiverton' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'bg-gray-800 text-white shadow-md')
                                            : 'text-text-muted hover:text-text-main hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {prop}
                                </button>
                             ))}
                        </div>
                    </div>
                </header>

                {/* Mobile Search Bar */}
                <div className="md:hidden mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-text-muted" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl leading-5 bg-surface placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 bg-surface/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                        {/* Selection Controls */}
                        {isSelectionMode ? (
                            <>
                                <button 
                                    onClick={() => setIsSelectionMode(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-4 h-4 text-text-muted" />
                                    <span className="text-sm font-medium text-text-main">Cancel</span>
                                </button>
                                <button 
                                    onClick={handleSelectAll}
                                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                    title={selectedJobIds.size === sortedFilteredJobs.length ? "Deselect All" : "Select All"}
                                >
                                    <ListChecks className="w-4 h-4 text-text-muted" />
                                    <span className="text-sm font-medium text-text-main">
                                        {selectedJobIds.size === sortedFilteredJobs.length ? 'Deselect All' : `Select All (${sortedFilteredJobs.length})`}
                                    </span>
                                </button>
                                <button 
                                    onClick={handleMassDelete}
                                    disabled={selectedJobIds.size === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 border border-red-200 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-sm font-medium">Delete ({selectedJobIds.size})</span>
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setIsSelectionMode(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                title="Mass Delete / Select"
                            >
                                <ListChecks className="w-4 h-4 text-text-muted" />
                                <span className="text-sm font-medium text-text-main">Select</span>
                            </button>
                        )}

                        {/* Analyze Duplicates */}
                        <button 
                            onClick={handleAnalyzeDuplicates}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            title="Find duplicate jobs"
                        >
                            <AlertTriangle className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-medium text-text-main">Duplicates</span>
                        </button>

                        {/* Sort */}
                        <div className="relative">
                            <select 
                                value={`${sortConfig.field}-${sortConfig.direction}`}
                                onChange={(e) => {
                                    const [field, direction] = e.target.value.split('-');
                                    setSortConfig({ field: field as any, direction: direction as any });
                                }}
                                className="appearance-none flex items-center h-[38px] pl-4 pr-10 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm font-medium text-text-main cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="in_home_date-asc">Due Date (Earliest)</option>
                                <option value="in_home_date-desc">Due Date (Latest)</option>
                                <option value="vendor_mail_date-asc">Mail Date (Earliest)</option>
                                <option value="vendor_mail_date-desc">Mail Date (Latest)</option>
                                <option value="art_submission_due-asc">Art Due (Earliest)</option>
                                <option value="art_submission_due-desc">Art Due (Latest)</option>
                            </select>
                            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>

                        <div className="h-6 w-px bg-border mx-2 hidden md:block opacity-50" />

                        {/* Export JSON */}
                        <button 
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm group"
                            title="Export all jobs to JSON"
                        >
                            <Upload className="w-4 h-4 text-text-muted rotate-180 group-hover:-translate-y-0.5 transition-transform" />
                            <span className="text-sm font-medium text-text-main">Export</span>
                        </button>

                        {/* Import JSON */}
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm group"
                            title="Import JSON jobs"
                        >
                            <Plus className="w-4 h-4 text-text-muted group-hover:rotate-90 transition-transform" />
                            <span className="text-sm font-medium text-text-main">Import JSON</span>
                        </button>
                        
                        {/* Shortcuts Help Button */}
                        <button 
                            onClick={() => setIsShortcutsOpen(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-text-muted hover:text-text-main"
                            title="Keyboard Shortcuts (?)"
                        >
                            <Keyboard className="w-5 h-5" />
                        </button>
                    </div>

                    <button 
                        onClick={handleOpenAddJob}
                        className="flex items-center gap-2 px-5 py-2.5 bg-ballys-red text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span className="text-sm font-bold">New Job</span>
                    </button>
                </div>

                {/* Job Grid */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-20 text-text-muted">Loading campaigns...</div>
                    ) : sortedFilteredJobs.length === 0 ? (
                        <div className="text-center py-20 bg-surface border border-dashed border-border rounded-xl">
                            <p className="text-text-muted mb-2">No active campaigns found for {format(currentMonth, 'MMMM yyyy')}</p>
                            <p className="text-xs text-text-light">Change the month or add a new job to get started</p>
                        </div>
                    ) : (
                        sortedFilteredJobs.map(job => (
                            <JobCard 
                                key={job.id} 
                                job={job} 
                                onUpdate={handleUpdateJob} 
                                onDelete={handleDeleteJob} 
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedJobIds.has(job.id)}
                                onToggleSelect={handleToggleSelect}
                            />
                        ))
                    )}
                </div>

                <AddJobModal 
                    isOpen={isAddJobModalOpen}
                    onClose={() => setIsAddJobModalOpen(false)}
                    onAdd={handleCreateJob}
                    currentMonth={currentMonth}
                />

                <ImportJsonModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportJobs}
                />

                <ExportJsonModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    jobs={jobs}
                />

                <ShortcutsHelp 
                    isOpen={isShortcutsOpen}
                    onClose={() => setIsShortcutsOpen(false)}
                />
            </div>
            
            <div className="mt-12">
                <Footer variant="default" />
            </div>
        </div>
    );
}
