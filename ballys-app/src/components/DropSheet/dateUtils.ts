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

export function calculateMilestoneDates(inHomeDateStr: string) {
    if (!inHomeDateStr) return { mailDropDate: null, artDueDate: null };
    
    const inHome = parseISO(inHomeDateStr);
    if (!isValid(inHome)) return { mailDropDate: null, artDueDate: null };

    const mailDropDate = subtractBusinessDays(inHome, BUSINESS_DAYS_TO_DROP);
    const artDueDate = subtractBusinessDays(mailDropDate, BUSINESS_DAYS_TO_ART);

    return {
        mailDropDate,
        artDueDate
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
