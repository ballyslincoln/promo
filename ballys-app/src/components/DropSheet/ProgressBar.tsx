import type { JobMilestones } from '../../services/dropSheetService';
import { calculateMilestoneDates } from './dateUtils';
import { format, parseISO, differenceInCalendarDays, isAfter } from 'date-fns';
import { Check, AlertCircle, Clock, Loader2, Truck, Home } from 'lucide-react';
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

export default function ProgressBar({ milestones, inHomeDate, mailType, onMilestoneClick }: ProgressBarProps & { mailType: string }) {
    const { mailDropDate, artDueDate, artSubmissionDueDate } = calculateMilestoneDates(inHomeDate, mailType);
    const today = new Date();

    // Calculate Progress Status Message
    let statusMessage = '';
    let statusColor: 'green' | 'yellow' | 'red' | 'blue' = 'green';

    if (isCompleted(milestones.mailed)) {
        statusMessage = 'Completed';
        statusColor = 'blue';
    } else {
        // Determine Next Critical Deadline
        let nextDeadline: Date | null = null;
        let deadlineLabel = '';

        if (!milestones.creative_received && artSubmissionDueDate) {
            nextDeadline = artSubmissionDueDate;
            deadlineLabel = 'Submit Art';
        } else if (mailDropDate) {
            nextDeadline = mailDropDate;
            deadlineLabel = 'Drop Mail';
        }

        if (nextDeadline) {
            // Calculate days relative to TODAY (Signed: Negative = Past, Positive = Future)
            const daysRemaining = differenceInCalendarDays(nextDeadline, today);
            
            if (daysRemaining < 0) {
                statusMessage = `${deadlineLabel} Overdue (${Math.abs(daysRemaining)}d)`;
                statusColor = 'red';
            } else if (daysRemaining === 0) {
                statusMessage = `${deadlineLabel} Due Today`;
                statusColor = 'yellow';
            } else if (daysRemaining <= 3) {
                statusMessage = `${deadlineLabel} in ${daysRemaining} Days`;
                statusColor = 'yellow';
            } else {
                statusMessage = `${deadlineLabel} in ${daysRemaining} Days`;
                statusColor = 'green';
            }
        } else {
            statusMessage = 'Pending Schedule';
            statusColor = 'blue'; // Neutral
        }
    }

    return (
        <div className="w-full flex flex-col gap-2">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full">
                {VISIBLE_STEPS.map((step) => {
                    
                    // Check if enabled based on dependencies
                    const requiredSteps = DEPENDENCIES[step.key];
                    const safeMilestones = milestones || {};
                    const isEnabled = !requiredSteps || requiredSteps.every(reqStep => {
                         const reqStatus = safeMilestones[`${reqStep}_status` as keyof JobMilestones];
                         return !!safeMilestones[reqStep] || reqStatus === 'completed';
                    });
                    
                    const canToggle = isEnabled; 
                    const dateVal = safeMilestones[step.key];
                    const statusKey = `${step.key}_status` as keyof JobMilestones;
                    const status = safeMilestones[statusKey] || (dateVal ? 'completed' : 'pending');
                    const isCompleted = status === 'completed';
                    const isInProgress = status === 'in_progress'; 

                    // Custom Logic for "Mailed" status (On Way vs In Homes)
                    let isMailed = false;
                    let isInHomes = false;

                    if (step.key === 'mailed' && isCompleted) {
                        isMailed = true;
                        const mailedDate = dateVal ? parseISO(dateVal) : null;
                        const inHomeTarget = inHomeDate ? parseISO(inHomeDate) : null;
                        
                        // If today is past the in-home date, assume it's "In Homes"
                        if (mailedDate && inHomeTarget && isAfter(new Date(), inHomeTarget)) {
                            isInHomes = true;
                        }
                    }

                    return (
                        <div key={step.key} className="flex flex-col items-center flex-1 group relative">
                            <motion.button
                                type="button"
                                whileHover={canToggle && !isCompleted ? { scale: 1.05 } : {}}
                                whileTap={canToggle && !isCompleted ? { scale: 0.95 } : {}}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (canToggle && !isCompleted) onMilestoneClick(step.key);
                                }}
                                className={`
                                    w-full h-8 rounded-md flex items-center justify-center text-[10px] font-bold uppercase tracking-wide transition-all border shadow-sm overflow-hidden relative
                                    ${isInHomes
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                        : isMailed
                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                                            : isCompleted 
                                                ? 'bg-green-500 text-white border-green-600 shadow-green-900/20' 
                                                : isInProgress
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
                                                    : canToggle 
                                                        ? 'bg-white dark:bg-slate-800 text-text-muted border-border hover:border-blue-400 hover:text-blue-500 hover:shadow-md' 
                                                        : 'bg-gray-50 dark:bg-slate-900 text-gray-300 dark:text-slate-700 border-transparent cursor-not-allowed opacity-60'}
                                    ${isCompleted ? 'cursor-default' : ''}
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
                                    {isInHomes ? (
                                        <>
                                            <Home className="w-3.5 h-3.5" />
                                            In Homes
                                        </>
                                    ) : isMailed ? (
                                        <>
                                            <motion.div
                                                animate={{ x: [-2, 2, -2] }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                            >
                                                <Truck className="w-3.5 h-3.5" />
                                            </motion.div>
                                            On Way
                                        </>
                                    ) : isCompleted ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : isInProgress ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : null}
                                    
                                    {!isMailed && !isInHomes && !isInProgress && step.label}
                                    {isInProgress && 'Working'}
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
            <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-text-muted px-1 mt-1 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-border/50 gap-2">
                 <div className="flex gap-2 sm:gap-4 items-center flex-wrap justify-center">
                    {/* Art Submission Due (New, Highlighted) */}
                    <div className="flex flex-col bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800/50">
                        <span className="uppercase tracking-wider text-[9px] font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">Submit Art</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                            {artSubmissionDueDate ? format(artSubmissionDueDate, 'MMM d') : '-'}
                        </span>
                    </div>

                    <div className="h-6 w-px bg-border/50 hidden sm:block" />

                    <div className="flex flex-col opacity-75">
                        <span className="uppercase tracking-wider text-[9px] font-bold whitespace-nowrap">Vendor Art</span>
                        <span className="font-mono text-text-main">
                            {artDueDate ? format(artDueDate, 'MMM d') : '-'}
                        </span>
                    </div>
                    <div className="flex flex-col opacity-75">
                        <span className="uppercase tracking-wider text-[9px] font-bold whitespace-nowrap">Drop Goal</span>
                        <span className="font-mono text-text-main">
                            {mailDropDate ? format(mailDropDate, 'MMM d') : '-'}
                        </span>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border font-bold uppercase tracking-wider transition-colors w-full sm:w-auto justify-center ${
                        statusColor === 'red' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800' :
                        statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800' :
                        statusColor === 'green' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800' :
                        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
                    }`}>
                        {statusColor === 'red' && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                        {statusColor === 'green' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
                        {statusColor === 'blue' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                        {statusColor === 'yellow' && <Clock className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span className="truncate">{statusMessage}</span>
                    </div>
                 </div>
            </div>
        </div>
    );
}

function isCompleted(dateStr?: string) {
    return !!dateStr;
}
