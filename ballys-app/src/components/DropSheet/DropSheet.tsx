import { useState, useEffect } from 'react';
import { dropSheetService } from '../../services/dropSheetService';
import type { MailJob } from '../../services/dropSheetService';
import JobCard from './JobCard';
import AddJobModal from './AddJobModal';
import ShortcutsHelp from './ShortcutsHelp';
import { Plus, Upload, ArrowLeft, Database, ChevronLeft, ChevronRight, Trash2, AlertTriangle, ListChecks, ArrowUpDown, X, Keyboard } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth, parseISO, isValid } from 'date-fns';
import { SEED_JOBS } from '../../services/seedData';

interface DropSheetProps {
    onBack: () => void;
}

export default function DropSheet({ onBack }: DropSheetProps) {
    const [jobs, setJobs] = useState<MailJob[]>([]);
    const [propertyFilter, setPropertyFilter] = useState<'All' | 'Lincoln' | 'Tiverton'>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date()); // Default to today (which will be Jan 2026 or current real time)
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

    // Mass Selection & Delete
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

    // Sort Configuration
    const [sortConfig, setSortConfig] = useState<{ field: 'in_home_date' | 'vendor_mail_date', direction: 'asc' | 'desc' }>({
        field: 'in_home_date',
        direction: 'asc'
    });

    useEffect(() => {
        loadJobs();
    }, []);

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
            if (isAddJobModalOpen) {
                if (e.key === 'Escape') setIsAddJobModalOpen(false);
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
                    handleExportJSON();
                    break;
                case 'i':
                    e.preventDefault();
                    document.getElementById('json-import-input')?.click();
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
    }, [isAddJobModalOpen, isSelectionMode, selectedJobIds, isShortcutsOpen, jobs, currentMonth]); // Added deps for closures

    const loadJobs = async () => {
        setIsLoading(true);
        const data = await dropSheetService.getJobs();
        setJobs(data);
        setIsLoading(false);
    };

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

    const handleSeedData = async () => {
        if (!confirm('This will add historical and future test data. Continue?')) return;
        setIsLoading(true);
        for (const job of SEED_JOBS) {
            try {
                if (!jobs.find(j => j.id === job.id)) {
                    await dropSheetService.createJob(job);
                }
            } catch (e) {
                console.warn('Seed job might already exist:', job.id);
            }
        }
        await loadJobs();
        setIsLoading(false);
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

    const handleMassDelete = async () => {
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
    };

    const handleAnalyzeDuplicates = () => {
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
    };
    
    const toggleSort = () => {
        setSortConfig(prev => ({
            ...prev,
            direction: prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const importedJobs = JSON.parse(text);
                
                if (!Array.isArray(importedJobs)) {
                    alert('Invalid JSON format: Expected an array of jobs');
                    return;
                }

                const newJobs: MailJob[] = [];
                for (const job of importedJobs) {
                    if (job.campaign_name && job.property) {
                         // Avoid collision if ID exists, or use ID from JSON if safe
                         // We'll check against existing 'jobs' state to verify duplication
                         const exists = jobs.find(j => j.id === job.id);
                         const cleanJob: MailJob = {
                            ...job,
                            id: exists ? crypto.randomUUID() : (job.id || crypto.randomUUID()),
                            created_at: job.created_at || new Date().toISOString()
                        };
                        newJobs.push(cleanJob);
                    }
                }

                setIsLoading(true);
                for (const job of newJobs) {
                    await dropSheetService.createJob(job);
                }
                await loadJobs();
                setIsLoading(false);
                alert(`Successfully imported ${newJobs.length} jobs`);
                
                // Reset input
                e.target.value = '';
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import JSON file');
            }
        };
        reader.readAsText(file);
    };

    const handleExportJSON = () => {
        const dataStr = JSON.stringify(jobs, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `marketing_jobs_${format(new Date(), 'yyyy-MM-dd')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };


    const handleOpenAddJob = () => {
        setIsAddJobModalOpen(true);
    };

    const handleCreateJob = async (newJob: MailJob) => {
        setJobs(prev => [...prev, newJob]);
        await dropSheetService.createJob(newJob);
    };

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    // Filter jobs by property AND month (using In-Home Date as anchor)
    const filteredJobs = jobs.filter(job => {
        const matchesProperty = propertyFilter === 'All' || job.property === propertyFilter;
        
        // Parse in_home_date to check month
        let matchesMonth = false;
        if (job.in_home_date) {
            const jobDate = parseISO(job.in_home_date);
            if (isValid(jobDate)) {
                matchesMonth = isSameMonth(jobDate, currentMonth);
            }
        }
        
        return matchesProperty && matchesMonth;
    });

    const sortedFilteredJobs = [...filteredJobs].sort((a, b) => {
        const dateA = a[sortConfig.field] ? new Date(a[sortConfig.field]).getTime() : 0;
        const dateB = b[sortConfig.field] ? new Date(b[sortConfig.field]).getTime() : 0;
        
        if (sortConfig.direction === 'asc') {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });

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
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end bg-surface/50 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm">
                        {/* Month Navigator */}
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
                        
                        {/* Property Toggle */}
                        <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 shadow-sm">
                             {(['Lincoln', 'Tiverton', 'All'] as const).map((prop) => (
                                <button 
                                    key={prop}
                                    onClick={() => setPropertyFilter(prop)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        propertyFilter === prop 
                                            ? prop === 'Lincoln' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                            : prop === 'Tiverton' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                            : 'bg-gray-800 text-white shadow-md'
                                            : 'text-text-muted hover:text-text-main hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {prop}
                                </button>
                             ))}
                        </div>
                    </div>
                </header>

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
                        <button 
                            onClick={toggleSort}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                            title={`Sort by ${sortConfig.field === 'in_home_date' ? 'In-Home Date' : 'Vendor Mail Date'} (${sortConfig.direction})`}
                        >
                            <ArrowUpDown className={`w-4 h-4 text-text-muted transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                            <span className="text-sm font-medium text-text-main">
                                {sortConfig.field === 'in_home_date' ? 'Due Date' : 'Mail Date'}
                            </span>
                        </button>

                        <div className="h-6 w-px bg-border mx-2 hidden md:block opacity-50" />

                        {/* Export JSON */}
                        <button 
                            onClick={handleExportJSON}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm group"
                            title="Export all jobs to JSON"
                        >
                            <Upload className="w-4 h-4 text-text-muted rotate-180 group-hover:-translate-y-0.5 transition-transform" />
                            <span className="text-sm font-medium text-text-main">Export</span>
                        </button>

                        {/* Import JSON */}
                        <label className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm group">
                            <Plus className="w-4 h-4 text-text-muted group-hover:rotate-90 transition-transform" />
                            <span className="text-sm font-medium text-text-main">Import JSON</span>
                            <input id="json-import-input" type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                        </label>
                        
                        {/* Seed Data Button */}
                        <button 
                            onClick={handleSeedData}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                            title="Load Test Data"
                        >
                            <Database className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-medium text-text-main">Seed Data</span>
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

                <ShortcutsHelp 
                    isOpen={isShortcutsOpen}
                    onClose={() => setIsShortcutsOpen(false)}
                />
            </div>
        </div>
    );
}
