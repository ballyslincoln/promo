import { useState } from 'react';
import type { MailJob, JobMilestones } from '../../services/dropSheetService';
import ProgressBar from './ProgressBar';
import PostageSelector from './PostageSelector';
import { Calendar, Save, Trash2, CheckCircle, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface JobCardProps {
    job: MailJob;
    onUpdate: (job: MailJob) => Promise<void> | void;
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
    const [showSaved, setShowSaved] = useState(false);

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

    const handleSave = async () => {
        await onUpdate(editedJob);
        setIsEditing(false);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
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
        <div className={`bg-surface border rounded-xl p-6 mb-4 shadow-sm hover:shadow-md transition-all relative overflow-visible group ${
            job.mail_type.toLowerCase().includes('core') 
                ? 'border-yellow-400 ring-1 ring-yellow-400/50 dark:border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-900/10' 
                : 'border-border'
        }`}>
            {/* Saved Notification Popup */}
            {showSaved && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full flex items-center gap-2 text-xs font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 z-20">
                    <CheckCircle className="w-3 h-3" />
                    Saved Successfully
                </div>
            )}

            <div className="flex flex-col gap-6">
                {/* Header Section: Selection + Job # + Campaign Name */}
                <div className="flex items-start gap-4">
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                        <div className="pt-1">
                            <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={(e) => onToggleSelect?.(job.id, e.target.checked)}
                                className="w-5 h-5 accent-ballys-red cursor-pointer"
                            />
                        </div>
                    )}

                    {/* Status Strip */}
                    <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${job.property === 'Lincoln' ? 'bg-blue-500' : 'bg-orange-500'}`} />

                    {/* Job Header Info */}
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                            {/* Job Number & Campaign Name Group */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 bg-surface-highlight border border-border rounded text-[10px] font-mono text-text-muted uppercase tracking-wider flex items-center">
                                        Job #{isEditing ? (
                                            <input 
                                                type="text" 
                                                value={editedJob.job_number || ''} 
                                                onChange={e => handleChange('job_number', e.target.value)}
                                                className="bg-surface border-b border-text-muted/50 focus:border-blue-500 outline-none min-w-[4rem] w-auto text-center ml-1 relative z-50"
                                                placeholder="---"
                                            />
                                        ) : (
                                            <span className="ml-1 text-text-main font-bold">{job.job_number || '---'}</span>
                                        )}
                                    </span>
                                    {!isEditing && (
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                            (job.postage || 'Standard') === 'First Class' 
                                                ? 'bg-orange-100 text-orange-700 border-orange-200' 
                                                : 'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                            {job.postage || 'Standard'}
                                        </span>
                                    )}
                                </div>

                                {/* Campaign Name - Larger and Spaced */}
                                <div className="flex items-start gap-2">
                                    <span className="text-lg mt-0.5">📢</span>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            value={editedJob.campaign_name} 
                                            onChange={e => handleChange('campaign_name', e.target.value)}
                                            className="bg-background border border-border rounded-lg px-3 py-2 text-lg font-bold w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    ) : (
                                        <h3 className="text-lg font-bold text-text-main leading-tight">{job.campaign_name}</h3>
                                    )}
                                </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex items-center gap-2 self-start md:self-center">
                                {isEditing ? (
                                    <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border shadow-sm">
                                        <button onClick={handleSave} className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-xs font-bold flex items-center gap-1 transition-colors">
                                            <Save className="w-3 h-3" />
                                            Save
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 text-text-muted rounded-md text-xs font-bold transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 opacity-100 transition-opacity duration-200">
                                        <button onClick={() => setIsEditing(true)} className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit Job">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDelete(job.id)} className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete Job">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Secondary Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 pt-2">
                            {/* Type */}
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Mail Type</label>
                                {isEditing ? (
                                    <select 
                                        value={editedJob.mail_type}
                                        onChange={e => handleChange('mail_type', e.target.value)}
                                        className="bg-background border border-border rounded px-2 py-1 text-sm w-full"
                                    >
                                        <option value="Core/Newsletter">Core/Newsletter</option>
                                        <option value="6x9 Postcard">6x9 Postcard</option>
                                        <option value="Letter">Letter</option>
                                        <option value="Tri-Fold">Tri-Fold</option>
                                        <option value="Bi-Fold">Bi-Fold</option>
                                    </select>
                                ) : (
                                    <span className="text-sm font-medium text-text-main">{job.mail_type}</span>
                                )}
                            </div>

                            {/* Quantity */}
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Quantity</label>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={editedJob.quantity} 
                                        onChange={e => handleChange('quantity', parseInt(e.target.value))}
                                        className="bg-background border border-border rounded px-2 py-1 text-sm w-full"
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-text-main">{job.quantity.toLocaleString()}</span>
                                )}
                            </div>

                            {/* Submitted Date */}
                            <div className="flex flex-col">
                                 <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Submitted</label>
                                 {isEditing ? (
                                    <input 
                                        type="date" 
                                        value={editedJob.submitted_date || ''} 
                                        onChange={handleSubmittedDateChange}
                                        className="bg-background border border-border rounded px-2 py-1 text-sm w-full"
                                    />
                                 ) : (
                                    <div className="flex items-center gap-2 h-6">
                                        <input 
                                            type="checkbox" 
                                            checked={!!job.submitted_date || job.job_submitted}
                                            onChange={handleToggleSubmitted}
                                            className="w-4 h-4 accent-ballys-red cursor-pointer"
                                        />
                                        {job.submitted_date ? (
                                            <span className="text-sm font-medium text-text-main">
                                                {format(parseISO(job.submitted_date), 'MMM d')}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-text-muted italic">Pending</span>
                                        )}
                                    </div>
                                 )}
                            </div>

                            {/* In-Home Date */}
                            <div className="flex flex-col">
                                <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">In-Home Target</label>
                                {isEditing ? (
                                    <input 
                                        type="date" 
                                        value={editedJob.in_home_date} 
                                        onChange={e => handleChange('in_home_date', e.target.value)}
                                        className="bg-background border border-border rounded px-2 py-1 text-sm w-full"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {job.in_home_date ? format(parseISO(job.in_home_date), 'MMM d, yyyy') : 'Not Set'}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Editor-only Fields */}
                        {isEditing && (
                            <div className="mt-4 p-4 bg-surface-highlight/30 rounded-lg border border-border/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">Postage Class</label>
                                        <PostageSelector 
                                            postage={editedJob.postage || 'Standard'} 
                                            quantity={editedJob.quantity} 
                                            onChange={(val) => handleChange('postage', val)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar Section */}
            <div className="mt-6 pt-4 border-t border-border/50">
                {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        <div className="col-span-full text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                            Milestone Dates
                        </div>
                        {[
                            { key: 'outline_given', label: 'Outline' },
                            { key: 'data_received', label: 'Data Rec.' },
                            { key: 'data_approved', label: 'Data App.' },
                            { key: 'creative_received', label: 'Creative Rec.' },
                            { key: 'creative_approved', label: 'Creative App.' },
                            { key: 'mailed', label: 'Mailed' }
                        ].map((step) => {
                            const key = step.key as keyof JobMilestones;
                            const val = editedJob.milestones[key];
                            const dateVal = val && typeof val === 'string' ? format(parseISO(val), 'yyyy-MM-dd') : '';
                            
                            return (
                                <div key={step.key} className="flex flex-col">
                                    <label className="text-[10px] font-medium text-text-muted mb-1 truncate" title={step.label}>{step.label}</label>
                                    <input 
                                        type="date"
                                        value={dateVal}
                                        onChange={(e) => handleMilestoneDateChange(key, e.target.value)}
                                        className="bg-white dark:bg-slate-800 border border-border rounded px-1 py-1 text-[10px] w-full"
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <ProgressBar 
                        milestones={job.milestones} 
                        inHomeDate={job.in_home_date}
                        vendorMailDate={job.vendor_mail_date}
                        mailType={job.mail_type}
                        onMilestoneClick={handleMilestoneClick}
                    />
                )}
            </div>
        </div>
    );
}