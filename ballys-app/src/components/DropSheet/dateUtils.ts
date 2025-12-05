import { isWeekend, subDays, differenceInCalendarDays, parseISO, isValid, startOfDay } from 'date-fns';
import { isHoliday } from './holidays';

export const BUSINESS_DAYS_TO_DROP = 10;
export const BUSINESS_DAYS_TO_ART = 5;

// Helper to subtract business days
export function subtractBusinessDays(date: Date, days: number): Date {
    let current = date;
    let remaining = days;
    while (remaining > 0) {
        current = subDays(current, 1);
        if (!isWeekend(current) && !isHoliday(current)) {
            remaining--;
        }
    }
    return current;
}

export function calculateMilestoneDates(inHomeDateStr: string, mailType: string = '') {
    if (!inHomeDateStr) return { mailDropDate: null, artDueDate: null, artSubmissionDueDate: null };
    
    const inHome = parseISO(inHomeDateStr);
    if (!isValid(inHome)) return { mailDropDate: null, artDueDate: null, artSubmissionDueDate: null };

    const mailDropDate = subtractBusinessDays(inHome, BUSINESS_DAYS_TO_DROP);
    
    // New Logic: Art Submission Due Date relative to MAIL DROP DATE
    // Core/Newsletter: 35 days before Mail Drop
    // Postcards (and others): 28 days before Mail Drop
    const isCore = mailType.toLowerCase().includes('core') || mailType.toLowerCase().includes('newsletter');
    const submissionLeadTime = isCore ? 35 : 28;
    
    // Using calendar days for long lead times
    const artSubmissionDueDate = subDays(mailDropDate, submissionLeadTime);

    // Existing Art Due Date (Vendor Handover)
    const artDueDate = subtractBusinessDays(mailDropDate, BUSINESS_DAYS_TO_ART);

    return {
        mailDropDate,
        artDueDate, // Vendor Handover
        artSubmissionDueDate // New "Art Submission" deadline
    };
}

export function calculateDatesFromFirstValid(firstValidDateStr: string, mailType: string = '') {
    if (!firstValidDateStr) return null;
    
    const firstValid = parseISO(firstValidDateStr);
    if (!isValid(firstValid)) return null;

    const isCore = mailType.toLowerCase().includes('core') || mailType.toLowerCase().includes('newsletter');
    // "14 days before core and 10 days before a postcard" for In Home Target
    const daysPrior = isCore ? 14 : 10;
    
    const inHomeDate = subDays(firstValid, daysPrior);
    
    // Calculate others based on inHomeDate
    const milestones = calculateMilestoneDates(inHomeDate.toISOString(), mailType);
    
    return {
        inHomeDate,
        ...milestones
    };
}

export function getLagDays(targetDate: Date, actualDate: Date): number {
    return differenceInCalendarDays(actualDate, targetDate);
}

export function isBehindSchedule(
    milestones: { data_approved?: string },
    artDueDate: Date | null,
    today: Date = new Date()
): boolean {
    if (!artDueDate) return false;
    
    // If today is past the Art Due Date AND Data Approved is NOT checked
    const isPastDue = startOfDay(today) > startOfDay(artDueDate);
    const isDataApproved = !!milestones.data_approved;
    
    return isPastDue && !isDataApproved;
}
