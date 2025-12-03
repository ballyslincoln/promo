import { useState, useEffect } from 'react';
import { dropSheetService } from '../../services/dropSheetService';
import type { MailJob } from '../../services/dropSheetService';
import JobCard from './JobCard';
import { Plus, Upload, ArrowLeft, Database } from 'lucide-react';
import { format } from 'date-fns';
import { SEED_JOBS } from '../../services/seedData';

interface DropSheetProps {
    onBack: () => void;
}

export default function DropSheet({ onBack }: DropSheetProps) {
    const [jobs, setJobs] = useState<MailJob[]>([]);
    const [propertyFilter, setPropertyFilter] = useState<'All' | 'Lincoln' | 'Tiverton'>('All');
    const [isLoading, setIsLoading] = useState(true);

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
            // Check if exists (simple client side check or just try create)
            // DB insert uses ON CONFLICT normally if configured, but here we just blindly insert or catch error
            try {
                // Check if ID exists in current list to avoid dupes visually before refresh
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const handleAddJob = async () => {
        const newJob: MailJob = {
            id: crypto.randomUUID(),
            campaign_name: 'New Campaign',
            mail_type: 'Core/Newsletter',
            property: propertyFilter === 'All' ? 'Lincoln' : propertyFilter,
            job_submitted: false,
            postage: 'Standard',
            quantity: 0,
            in_home_date: format(new Date(), 'yyyy-MM-dd'),
            first_valid_date: '',
            vendor_mail_date: '',
            milestones: {},
            created_at: new Date().toISOString()
        };
        
        setJobs(prev => [...prev, newJob]);
        await dropSheetService.createJob(newJob);
    };

    const filteredJobs = jobs.filter(job => propertyFilter === 'All' || job.property === propertyFilter);

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
                        <label className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <Upload className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-medium text-text-main">Import CSV</span>
                            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                        </label>
                        
                        {/* Seed Data Button (Hidden in Prod usually, but good for testing) */}
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
                        onClick={handleAddJob}
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
                            <p className="text-text-muted mb-2">No active campaigns found</p>
                            <p className="text-xs text-text-light">Upload a CSV or create a new job to get started</p>
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
            </div>
        </div>
    );
}
