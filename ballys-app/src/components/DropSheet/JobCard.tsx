import { useState } from 'react';
import type { MailJob, JobMilestones } from '../../services/dropSheetService';
import ProgressBar from './ProgressBar';
import { Calendar, Save, Trash2, X } from 'lucide-react';

interface JobCardProps {
    job: MailJob;
    onUpdate: (job: MailJob) => void;
    onDelete: (id: string) => void;
}

export default function JobCard({ job, onUpdate, onDelete }: JobCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedJob, setEditedJob] = useState<MailJob>(job);

    const handleMilestoneClick = (key: keyof JobMilestones) => {
        const newMilestones = { ...job.milestones };
        if (newMilestones[key]) {
            // Toggle off? Requirement says "timestamps it as Complete". Usually unclicking clears it.
            delete newMilestones[key];
        } else {
            newMilestones[key] = new Date().toISOString();
        }
        onUpdate({ ...job, milestones: newMilestones });
    };

    const handleSave = () => {
        onUpdate(editedJob);
        setIsEditing(false);
    };

    const handleChange = (field: keyof MailJob, value: any) => {
        setEditedJob(prev => ({ ...prev, [field]: value }));
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
                            disabled={!isEditing}
                            onChange={e => handleChange('job_submitted', e.target.checked)}
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
                <ProgressBar 
                    milestones={job.milestones} 
                    inHomeDate={job.in_home_date}
                    vendorMailDate={job.vendor_mail_date}
                    onMilestoneClick={handleMilestoneClick}
                />
            </div>
        </div>
    );
}
