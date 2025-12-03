import { useState } from 'react';
import type { MailJob, JobMilestones } from '../../services/dropSheetService';
import ProgressBar from './ProgressBar';
import { Calendar, Save, Trash2, X, Check } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

interface JobCardProps {
    job: MailJob;
    onUpdate: (job: MailJob) => void;
    onDelete: (id: string) => void;
}

const DEPENDENCIES: Record<keyof JobMilestones, (keyof JobMilestones)[]> = {
    outline_given: [],
    data_received: [], // Independent
    data_approved: ['data_received'],
    creative_received: [], // Independent
    creative_approved: ['creative_received'],
    mailed: ['outline_given', 'data_approved', 'creative_approved'],
    // sent_to_vendor is hidden/ignored in UI for now
    sent_to_vendor: []
};

export default function JobCard({ job, onUpdate, onDelete }: JobCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedJob, setEditedJob] = useState<MailJob>(job);

    const handleMilestoneClick = (key: keyof JobMilestones) => {
        const newMilestones = { ...job.milestones };
        
        // Determine status key
        const statusKey = `${key}_status` as keyof JobMilestones;
        const currentStatus = newMilestones[statusKey] || 'pending';

        if (currentStatus === 'completed') {
             // Reset to pending
             delete newMilestones[key];
             delete newMilestones[statusKey];
        } else if (currentStatus === 'in_progress') {
             // Move to completed
             newMilestones[key] = new Date().toISOString();
             newMilestones[statusKey] = 'completed';
        } else {
            // Move to in_progress
            // Ensure required previous steps are completed
            const requiredSteps = DEPENDENCIES[key];
            if (requiredSteps && requiredSteps.length > 0) {
                const missingStep = requiredSteps.find(step => {
                    // Check if step is missing OR status is not completed
                    const stepStatus = newMilestones[`${step}_status` as keyof JobMilestones];
                    return !newMilestones[step] && stepStatus !== 'completed';
                });

                if (missingStep) {
                    alert(`Please complete '${missingStep.replace('_', ' ')}' first.`);
                    return;
                }
            }
            
            newMilestones[statusKey] = 'in_progress';
        }
        onUpdate({ ...job, milestones: newMilestones });
    };

    const handleToggleSubmitted = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        if (isEditing) {
            handleChange('job_submitted', isChecked);
        } else {
            onUpdate({ ...job, job_submitted: isChecked });
        }
    };

    const handleSave = () => {
        onUpdate(editedJob);
        setIsEditing(false);
    };

    const handleChange = (field: keyof MailJob, value: any) => {
        setEditedJob(prev => ({ ...prev, [field]: value }));
    };

    const handleMilestoneDateChange = (key: keyof JobMilestones, dateStr: string) => {
        const newMilestones = { ...editedJob.milestones };
        if (dateStr) {
            // Create date at noon to avoid timezone shifting to previous day
            const d = new Date(dateStr);
            d.setHours(12, 0, 0, 0);
            newMilestones[key] = d.toISOString();
        } else {
            delete newMilestones[key];
        }
        setEditedJob(prev => ({ ...prev, milestones: newMilestones }));
    };

    return (
        <div className="bg-surface border border-border rounded-xl p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
                {/* Status Indicator / Color Stripe */}
                <div className={`w-1.5 self-stretch rounded-full ${job.property === 'Lincoln' ? 'bg-blue-500' : 'bg-orange-500'}`} />

                {/* Main Info */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Campaign</label>
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={editedJob.campaign_name} 
                                onChange={e => handleChange('campaign_name', e.target.value)}
                                className="bg-background border border-border rounded px-2 py-1 text-sm"
                            />
                        ) : (
                            <span className="text-sm font-bold text-text-main truncate" title={job.campaign_name}>{job.campaign_name}</span>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Type</label>
                        {isEditing ? (
                            <select 
                                value={editedJob.mail_type}
                                onChange={e => handleChange('mail_type', e.target.value)}
                                className="bg-background border border-border rounded px-2 py-1 text-sm"
                            >
                                <option value="Core/Newsletter">Core/Newsletter</option>
                                <option value="6x9 Postcard">6x9 Postcard</option>
                                <option value="Letter">Letter</option>
                            </select>
                        ) : (
                            <span className="text-sm text-text-main">{job.mail_type}</span>
                        )}
                    </div>

                    <div className="flex flex-col items-start">
                         <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Submitted</label>
                         <input 
                            type="checkbox" 
                            checked={isEditing ? editedJob.job_submitted : job.job_submitted}
                            onChange={handleToggleSubmitted}
                            className="mt-1 w-4 h-4 accent-ballys-red cursor-pointer"
                         />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Quantity</label>
                        {isEditing ? (
                            <input 
                                type="number" 
                                value={editedJob.quantity} 
                                onChange={e => handleChange('quantity', parseInt(e.target.value))}
                                className="bg-background border border-border rounded px-2 py-1 text-sm"
                            />
                        ) : (
                            <span className="text-sm text-text-main">{job.quantity.toLocaleString()}</span>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold">In-Home</label>
                        {isEditing ? (
                            <input 
                                type="date" 
                                value={editedJob.in_home_date} 
                                onChange={e => handleChange('in_home_date', e.target.value)}
                                className="bg-background border border-border rounded px-2 py-1 text-sm"
                            />
                        ) : (
                            <span className="text-sm text-text-main flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-text-muted" />
                                {job.in_home_date || 'Not Set'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20">
                                <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-100 dark:bg-slate-800 text-text-muted rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700">
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="text-xs text-ballys-red hover:underline font-medium">
                            Edit Details
                        </button>
                    )}
                    <button onClick={() => onDelete(job.id)} className="text-text-muted hover:text-red-500 transition-colors p-2">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Progress Bar Section */}
            <div className="pt-2 border-t border-border/50">
                {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="col-span-full text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                            Edit Milestone Dates
                        </div>
                        {[
                            { key: 'outline_given', label: 'Outline' },
                            { key: 'data_received', label: 'Data Rec.' },
                            { key: 'data_approved', label: 'Data App.' },
                            { key: 'creative_received', label: 'Creative Rec.' },
                            { key: 'creative_approved', label: 'Creative App.' },
                            { key: 'mailed', label: 'Mailed' }
                        ].map((step) => {
                            const val = editedJob.milestones[step.key as keyof JobMilestones];
                            const dateVal = val ? format(parseISO(val), 'yyyy-MM-dd') : '';
                            
                            return (
                                <div key={step.key} className="flex flex-col">
                                    <label className="text-[10px] font-medium text-text-muted mb-1">{step.label}</label>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            value={dateVal}
                                            onChange={(e) => handleMilestoneDateChange(step.key as keyof JobMilestones, e.target.value)}
                                            className="bg-white dark:bg-slate-800 border border-border rounded px-2 py-1 text-xs w-full cursor-pointer"
                                            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                                        />
                                        <Calendar className="w-3 h-3 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <ProgressBar 
                        milestones={job.milestones} 
                        inHomeDate={job.in_home_date}
                        vendorMailDate={job.vendor_mail_date}
                        onMilestoneClick={handleMilestoneClick}
                    />
                )}
            </div>
        </div>
    );
}
