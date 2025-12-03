import { useState, useEffect } from 'react';
import { dropSheetService } from '../../services/dropSheetService';
import type { MailJob } from '../../services/dropSheetService';
import JobCard from './JobCard';
import AddJobModal from './AddJobModal';
import { Plus, Upload, ArrowLeft, Database, ChevronLeft, ChevronRight } from 'lucide-react';
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

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        setIsLoading(true);
        const data = await dropSheetService.getJobs();
        setJobs(data);
        setIsLoading(false);
    };

    const handleUpdateJob = async (updatedJob: MailJob) => {
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
        try {
            await dropSheetService.updateJob(updatedJob);
        } catch (e) {
            console.error("Failed to update job", e);
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

    // Renamed from handleFileUpload but kept for legacy CSV support if needed, 
    // or we can remove if user meant "fix import csv" by replacing it.
    // User said "fix import csv i want an export button... and upload button to import new json"
    // So I will keep CSV for now but add JSON as primary or side-by-side.
    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            
            const newJobs: MailJob[] = [];
            
            // Skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const cols = line.split(',').map(s => s.trim());
                if (cols.length < 5) continue;

                const job: MailJob = {
                    id: crypto.randomUUID(),
                    campaign_name: cols[0] || 'Untitled Campaign',
                    mail_type: cols[1] || 'Core/Newsletter',
                    property: (cols[2] === 'Lincoln' || cols[2] === 'Tiverton') ? cols[2] : 'Lincoln',
                    job_submitted: false,
                    postage: 'Standard',
                    quantity: parseInt(cols[3]) || 0,
                    in_home_date: cols[4] || '', 
                    first_valid_date: '',
                    vendor_mail_date: '',
                    milestones: {},
                    created_at: new Date().toISOString()
                };
                newJobs.push(job);
            }

            for (const job of newJobs) {
                await dropSheetService.createJob(job);
            }
            loadJobs();
        };
        reader.readAsText(file);
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

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-text-main" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-text-main">Marketing Logistics</h1>
                            <p className="text-text-muted text-sm">Track and manage direct mail campaigns</p>
                        </div>
                    </div>
                    
                    {/* Month Navigator */}
                    <div className="flex items-center bg-surface border border-border rounded-xl p-1 shadow-sm">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5 text-text-muted" />
                        </button>
                        <div className="px-6 min-w-[160px] text-center">
                            <span className="text-sm font-bold text-text-main block uppercase tracking-wider">
                                {format(currentMonth, 'MMMM yyyy')}
                            </span>
                        </div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ChevronRight className="w-5 h-5 text-text-muted" />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-surface p-1 rounded-lg border border-border shadow-sm">
                        <button 
                            onClick={() => setPropertyFilter('Lincoln')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${propertyFilter === 'Lincoln' ? 'bg-blue-500 text-white' : 'text-text-muted hover:text-text-main'}`}
                        >
                            Lincoln
                        </button>
                        <button 
                            onClick={() => setPropertyFilter('Tiverton')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${propertyFilter === 'Tiverton' ? 'bg-orange-500 text-white' : 'text-text-muted hover:text-text-main'}`}
                        >
                            Tiverton
                        </button>
                        <button 
                            onClick={() => setPropertyFilter('All')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${propertyFilter === 'All' ? 'bg-gray-800 text-white' : 'text-text-muted hover:text-text-main'}`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        {/* Export JSON */}
                        <button 
                            onClick={handleExportJSON}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            title="Export all jobs to JSON"
                        >
                            <Upload className="w-4 h-4 text-text-muted rotate-180" />
                            <span className="text-sm font-medium text-text-main">Export</span>
                        </button>

                        {/* Import JSON */}
                        <label className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <Plus className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-medium text-text-main">Import JSON</span>
                            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                        </label>

                         {/* Import CSV (Hidden or secondary? Keeping it for now as requested 'fix import csv') */}
                        <label className="hidden flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <Upload className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-medium text-text-main">Import CSV</span>
                            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                        </label>
                        
                        {/* Seed Data Button */}
                        <button 
                            onClick={handleSeedData}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            title="Load Test Data"
                        >
                            <Database className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-medium text-text-main">Seed Data</span>
                        </button>
                    </div>

                    <button 
                        onClick={handleOpenAddJob}
                        className="flex items-center gap-2 px-4 py-2 bg-ballys-red text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-bold">New Job</span>
                    </button>
                </div>

                {/* Job Grid */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-20 text-text-muted">Loading campaigns...</div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="text-center py-20 bg-surface border border-dashed border-border rounded-xl">
                            <p className="text-text-muted mb-2">No active campaigns found for {format(currentMonth, 'MMMM yyyy')}</p>
                            <p className="text-xs text-text-light">Change the month or add a new job to get started</p>
                        </div>
                    ) : (
                        filteredJobs.map(job => (
                            <JobCard 
                                key={job.id} 
                                job={job} 
                                onUpdate={handleUpdateJob} 
                                onDelete={handleDeleteJob} 
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
            </div>
        </div>
    );
}
