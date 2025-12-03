import { useState } from 'react';
import type { MailJob, JobMilestones } from '../../services/dropSheetService';
import ProgressBar from './ProgressBar';
import { Calendar, Save, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface JobCardProps {
    job: MailJob;
    onUpdate: (job: MailJob) => void;
    onDelete: (id: string) => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string, selected: boolean) => void;
}

const DEPENDENCIES: Partial<Record<keyof JobMilestones, (keyof JobMilestones)[]>> = {
    outline_given: [],
    data_received: [], // Independent
    data_approved: ['data_received'],
    creative_received: [], // Independent
    creative_approved: ['creative_received'],
    mailed: ['outline_given', 'data_approved', 'creative_approved'],
    // sent_to_vendor is hidden/ignored in UI for now
    sent_to_vendor: []
};

export default function JobCard({ job, onUpdate, onDelete, isSelectionMode, isSelected, onToggleSelect }: JobCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedJob, setEditedJob] = useState<MailJob>(job);

    const handleMilestoneClick = (key: keyof JobMilestones) => {
        const newMilestones = { ...job.milestones };
        
        // Determine status key
        const statusKey = `${key}_status` as keyof JobMilestones;
        const currentStatus = (newMilestones[statusKey] as 'pending' | 'in_progress' | 'completed' | undefined) || 'pending';

        if (currentStatus === 'completed') {
             // Reset to pending
             delete newMilestones[key];
             delete newMilestones[statusKey];
        } else if (currentStatus === 'in_progress') {
             // Move to completed
             (newMilestones as any)[key] = new Date().toISOString();
             // We know statusKey corresponds to a status field which is a string union type
             // TypeScript inference on indexed access of a wide type like JobMilestones can be tricky
             // We cast to any to bypass the strict index signature check for this dynamic assignment
             (newMilestones as any)[statusKey] = 'completed';
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
            
            (newMilestones as any)[statusKey] = 'in_progress';
        }
        onUpdate({ ...job, milestones: newMilestones });
    };

    const handleToggleSubmitted = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        // If checking the box: set date to today. If unchecking: set to null.
        const newDate = isChecked ? new Date().toISOString().split('T')[0] : undefined;
        
        if (isEditing) {
            handleChange('job_submitted', isChecked);
            handleChange('submitted_date', newDate);
        } else {
            onUpdate({ 
                ...job, 
                job_submitted: isChecked,
                submitted_date: newDate
            });
        }
    };
    
    const handleSubmittedDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateVal = e.target.value;
        handleChange('submitted_date', dateVal);
        // If date is cleared, uncheck. If date is set, check.
        handleChange('job_submitted', !!dateVal);
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
            (newMilestones as any)[key] = d.toISOString();
        } else {
            delete newMilestones[key];
        }
        setEditedJob(prev => ({ ...prev, milestones: newMilestones }));
    };

    return (
        <div className={`bg-surface border rounded-xl p-4 mb-3 shadow-sm hover:shadow-md transition-shadow ${
            job.mail_type.toLowerCase().includes('core') 
                ? 'border-yellow-400 ring-1 ring-yellow-400/50 dark:border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-900/10' 
                : 'border-border'
        }`}>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <div className="flex items-center h-full">
                        <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={(e) => onToggleSelect?.(job.id, e.target.checked)}
                            className="w-5 h-5 accent-ballys-red cursor-pointer"
                        />
                    </div>
                )}

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
                         {isEditing ? (
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={editedJob.submitted_date || ''} 
                                    onChange={handleSubmittedDateChange}
                                    className="bg-background border border-border rounded px-2 py-1 text-sm w-32"
                                />
                            </div>
                         ) : (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={!!job.submitted_date || job.job_submitted}
                                    onChange={handleToggleSubmitted}
                                    className="mt-0.5 w-4 h-4 accent-ballys-red cursor-pointer"
                                />
                                {(job.submitted_date) && (
                                    <span className="text-xs text-text-muted font-medium whitespace-nowrap">
                                        {format(parseISO(job.submitted_date), 'M/d')}
                                    </span>
                                )}
                            </div>
                         )}
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
                            // Type assertion since we are mapping a list of keys known to be in JobMilestones
                            const key = step.key as keyof JobMilestones;
                            const val = editedJob.milestones[key];
                            const dateVal = val && typeof val === 'string' ? format(parseISO(val), 'yyyy-MM-dd') : '';
                            
                            return (
                                <div key={step.key} className="flex flex-col">
                                    <label className="text-[10px] font-medium text-text-muted mb-1">{step.label}</label>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            value={dateVal}
                                            onChange={(e) => handleMilestoneDateChange(key, e.target.value)}
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
