import { sql } from '../db';

export interface JobMilestones {
    outline_given?: string;
    outline_given_status?: 'pending' | 'in_progress' | 'completed';
    
    data_received?: string;
    data_received_status?: 'pending' | 'in_progress' | 'completed';
    
    data_approved?: string;
    data_approved_status?: 'pending' | 'in_progress' | 'completed';
    
    creative_received?: string;
    creative_received_status?: 'pending' | 'in_progress' | 'completed';
    
    creative_approved?: string;
    creative_approved_status?: 'pending' | 'in_progress' | 'completed';
    
    sent_to_vendor?: string;
    sent_to_vendor_status?: 'pending' | 'in_progress' | 'completed';
    
    mailed?: string;
    mailed_status?: 'pending' | 'in_progress' | 'completed';
}

export interface MailJob {
    id: string;
    job_number?: string;
    campaign_name: string;
    mail_type: string;
    property: string; // 'Lincoln' | 'Tiverton'
    property_review?: boolean;
    job_submitted?: boolean; // Deprecated: kept for backward compatibility
    submitted_date?: string; // YYYY-MM-DD
    postage: string; // 'Standard' | 'First Class'
    quantity: number;
    in_home_date: string; // YYYY-MM-DD
    first_valid_date: string; // YYYY-MM-DD
    vendor_mail_date: string; // YYYY-MM-DD
    milestones: JobMilestones;
    created_at: string;
}

export const dropSheetService = {
    async getJobs(): Promise<MailJob[]> {
        if (!sql) {
            console.warn('DB not connected, returning empty jobs');
            return [];
        }
        try {
            const data = await sql`SELECT * FROM mail_jobs ORDER BY in_home_date ASC`;
            return data as unknown as MailJob[];
        } catch (e) {
            console.error('Failed to fetch jobs:', e);
            return [];
        }
    },

    async createJob(job: MailJob): Promise<void> {
        if (!sql) return;
        try {
            await sql`
                INSERT INTO mail_jobs (
                    id, job_number, campaign_name, mail_type, property, property_review,
                    job_submitted, submitted_date,
                    postage, quantity, in_home_date, first_valid_date, 
                    vendor_mail_date, milestones, created_at
                ) VALUES (
                    ${job.id}, ${job.job_number || null}, ${job.campaign_name}, ${job.mail_type}, ${job.property}, ${job.property_review ?? false},
                    ${job.job_submitted ?? false}, ${job.submitted_date ?? null},
                    ${job.postage ?? 'Standard'}, ${job.quantity ?? 0}, ${job.in_home_date ?? null}, ${job.first_valid_date ?? null},
                    ${job.vendor_mail_date ?? null}, ${JSON.stringify(job.milestones ?? {})}, ${job.created_at}
                )
            `;
        } catch (e) {
            console.error('Failed to create job:', e);
            throw e;
        }
    },

    async updateJob(job: MailJob): Promise<void> {
        if (!sql) return;
        try {
            await sql`
                UPDATE mail_jobs SET
                    job_number = ${job.job_number || null},
                    campaign_name = ${job.campaign_name},
                    mail_type = ${job.mail_type},
                    property = ${job.property},
                    property_review = ${job.property_review ?? false},
                    job_submitted = ${job.job_submitted ?? false},
                    submitted_date = ${job.submitted_date ?? null},
                    postage = ${job.postage ?? 'Standard'},
                    quantity = ${job.quantity ?? 0},
                    in_home_date = ${job.in_home_date ?? null},
                    first_valid_date = ${job.first_valid_date ?? null},
                    vendor_mail_date = ${job.vendor_mail_date ?? null},
                    milestones = ${JSON.stringify(job.milestones ?? {})}
                WHERE id = ${job.id}
            `;
        } catch (e) {
            console.error('Failed to update job:', e);
            throw e;
        }
    },

    async deleteJob(id: string): Promise<void> {
        if (!sql) return;
        try {
            await sql`DELETE FROM mail_jobs WHERE id = ${id}`;
        } catch (e) {
            console.error('Failed to delete job:', e);
            throw e;
        }
    }
};
