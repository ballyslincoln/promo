import type { JobMilestones } from '../../services/dropSheetService';
import { calculateMilestoneDates, isBehindSchedule, getLagDays } from './dateUtils';
import { format, parseISO, isValid } from 'date-fns';
import { Check, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
    milestones: JobMilestones;
    inHomeDate: string;
    vendorMailDate: string;
    onMilestoneClick: (key: keyof JobMilestones) => void;
}

const STEPS: { key: keyof JobMilestones; label: string; description: string }[] = [
    { key: 'outline_given', label: 'Outline', description: 'Project Start' },
    { key: 'data_received', label: 'Data Rec.', description: 'Customer List Arrived' },
    { key: 'data_approved', label: 'Data App.', description: 'Internal Sign-off' },
    { key: 'creative_received', label: 'Creative Rec.', description: 'Handover to Vendor' },
    { key: 'creative_approved', label: 'Creative App.', description: 'Proof Approved' },
    { key: 'sent_to_vendor', label: 'Vendor', description: 'Final Files Sent' }, // Note: Requirement said "Sent to Vendor" but structure has it separate? Let's map nicely. 
    // Wait, requirement said: Outline -> Data Rec -> Data App -> Creative Rec -> Creative App -> Mailed
    // My service has 'sent_to_vendor'. Let's stick to the defined sequence in prompt:
    // Outline -> Data Rec -> Data App -> Creative Rec -> Creative App -> Mailed
    // I'll hide 'sent_to_vendor' from UI if it's redundant or map it.
    // Actually, 'Creative Received' implies Vendor received it. 'Creative Approved' implies Proof. 
    // Let's just use the prompt's sequence.
    { key: 'mailed', label: 'Mailed', description: 'Left Facility' },
];

// Filtered steps based on prompt
const VISIBLE_STEPS = STEPS.filter(s => s.key !== 'sent_to_vendor');

// Milestone Dependencies logic (Mirrors JobCard logic)
const DEPENDENCIES: Partial<Record<keyof JobMilestones, (keyof JobMilestones)[]>> = {
    outline_given: [],
    data_received: [], // Independent
    data_approved: ['data_received'],
    creative_received: [], // Independent
    creative_approved: ['creative_received'],
    mailed: ['outline_given', 'data_approved', 'creative_approved'],
    sent_to_vendor: []
};

export default function ProgressBar({ milestones, inHomeDate, vendorMailDate, onMilestoneClick }: ProgressBarProps) {
    const { mailDropDate, artDueDate } = calculateMilestoneDates(inHomeDate);
    const today = new Date();

    // Check for late status (Mailed Date vs Target Drop Date)
    let isLate = false;
    let lagDays = 0;
    
    if (vendorMailDate && mailDropDate) {
         const mailed = parseISO(vendorMailDate);
         if (isValid(mailed) && mailed > mailDropDate) {
             isLate = true;
             lagDays = getLagDays(mailDropDate, mailed);
         }
    }

    // Check for "Behind Schedule" status (Data/Art Handover logic)
    // Prompt: If Today > Target Vendor Handover AND "Data Approved" is unchecked → Status = BEHIND.
    // "Target Vendor Handover" = Art Due Date in my calc? Yes (Drop - 5 days).
    const isBehind = isBehindSchedule(milestones, artDueDate, today);

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between w-full gap-1">
                {VISIBLE_STEPS.map((step) => {
                    const dateVal = milestones[step.key];
                    const statusKey = `${step.key}_status` as keyof JobMilestones;
                    const status = milestones[statusKey] || (dateVal ? 'completed' : 'pending');
                    const isCompleted = status === 'completed';
                    const isInProgress = status === 'in_progress';
                    
                    // Check if enabled based on dependencies
                    const requiredSteps = DEPENDENCIES[step.key];
                    const isEnabled = !requiredSteps || requiredSteps.every(reqStep => {
                         const reqStatus = milestones[`${reqStep}_status` as keyof JobMilestones];
                         return !!milestones[reqStep] || reqStatus === 'completed';
                    });
                    
                    const canToggle = isEnabled; 

                    return (
                        <div key={step.key} className="flex flex-col items-center flex-1 group relative">
                            <motion.button
                                whileHover={canToggle ? { scale: 1.05 } : {}}
                                whileTap={canToggle ? { scale: 0.95 } : {}}
                                onClick={() => canToggle && onMilestoneClick(step.key)}
                                className={`
                                    w-full h-8 rounded-md flex items-center justify-center text-[10px] font-bold uppercase tracking-wide transition-all border shadow-sm overflow-hidden relative
                                    ${isCompleted 
                                        ? 'bg-green-500 text-white border-green-600 shadow-green-900/20' 
                                        : isInProgress
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
                                            : canToggle 
                                                ? 'bg-white dark:bg-slate-800 text-text-muted border-border hover:border-blue-400 hover:text-blue-500 hover:shadow-md' 
                                                : 'bg-gray-50 dark:bg-slate-900 text-gray-300 dark:text-slate-700 border-transparent cursor-not-allowed opacity-60'}
                                `}
                                title={`${step.description}\nStatus: ${status}`}
                            >
                                {isInProgress && (
                                    <motion.div 
                                        className="absolute inset-0 bg-blue-500/10"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    />
                                )}
                                
                                <span className="relative z-10 flex items-center gap-1">
                                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : 
                                     isInProgress ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                    {isInProgress ? 'Working' : step.label}
                                </span>
                            </motion.button>
                            {isCompleted && milestones[step.key] && (
                                <span className="text-[9px] text-text-muted mt-1">
                                    {format(parseISO(milestones[step.key]!), 'M/d')}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* Dates Context & Status Indicators */}
            <div className="flex justify-between items-center text-[10px] text-text-muted px-1 mt-1 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-border/50">
                 <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="uppercase tracking-wider text-[9px] font-bold">Art Due</span>
                        <span className="font-mono text-text-main">
                            {artDueDate ? format(artDueDate, 'MMM d') : '-'}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="uppercase tracking-wider text-[9px] font-bold">Drop Goal</span>
                        <span className="font-mono text-text-main">
                            {mailDropDate ? format(mailDropDate, 'MMM d') : '-'}
                        </span>
                    </div>
                 </div>

                 <div className="flex items-center gap-3">
                    {isBehind && !isCompleted(milestones.mailed) && (
                        <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-1 rounded border border-red-200 dark:border-red-800/50 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="font-bold uppercase tracking-wider">Behind Schedule</span>
                        </div>
                    )}

                    {isLate && (
                         <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-1 rounded border border-red-200 dark:border-red-800/50">
                             <Clock className="w-3.5 h-3.5" />
                             <span className="font-bold uppercase tracking-wider">Late ({lagDays} Days)</span>
                         </div>
                    )}
                    
                    {!isBehind && !isLate && !isCompleted(milestones.mailed) && (
                        <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-1 rounded border border-green-200 dark:border-green-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="font-bold uppercase tracking-wider">On Track</span>
                        </div>
                    )}

                    {isCompleted(milestones.mailed) && (
                        <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded border border-blue-200 dark:border-blue-800/50">
                            <Check className="w-3.5 h-3.5" />
                            <span className="font-bold uppercase tracking-wider">Complete</span>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
}

function isCompleted(dateStr?: string) {
    return !!dateStr;
}
