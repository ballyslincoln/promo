import { useState } from 'react';
import { X, Upload, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import type { MailJob } from '../../services/dropSheetService';

interface ImportJsonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (jobs: MailJob[]) => void;
}

export default function ImportJsonModal({ isOpen, onClose, onImport }: ImportJsonModalProps) {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonText(e.target.value);
        setError(null);
        setPreviewCount(null);

        // Try to parse for live preview count if valid
        try {
            if (e.target.value.trim()) {
                const parsed = JSON.parse(e.target.value);
                if (Array.isArray(parsed)) {
                    setPreviewCount(parsed.length);
                }
            }
        } catch {
            // Ignore parsing errors during typing
        }
    };

    const handleImport = () => {
        if (!jsonText.trim()) {
            setError('Please paste JSON data first.');
            return;
        }

        try {
            const importedJobs = JSON.parse(jsonText);
            
            if (!Array.isArray(importedJobs)) {
                setError('Invalid JSON format: Expected an array of jobs [ ... ]');
                return;
            }

            const newJobs: MailJob[] = [];
            for (const job of importedJobs) {
                if (job.campaign_name && job.property) {
                        // Clean and validate job object
                        const cleanJob: MailJob = {
                        id: job.id || crypto.randomUUID(), // Use existing ID or generate new
                        job_number: job.job_number || null,
                        campaign_name: job.campaign_name,
                        mail_type: job.mail_type || '',
                        property: job.property,
                        job_submitted: job.job_submitted ?? false,
                        submitted_date: job.submitted_date || null,
                        postage: job.postage || 'Standard',
                        quantity: job.quantity ?? 0,
                        in_home_date: job.in_home_date || null,
                        first_valid_date: job.first_valid_date || null,
                        vendor_mail_date: job.vendor_mail_date || null,
                        milestones: job.milestones || {},
                        created_at: job.created_at || new Date().toISOString()
                    };
                    newJobs.push(cleanJob);
                }
            }

            if (newJobs.length === 0) {
                setError('No valid jobs found. Ensure objects have "campaign_name" and "property".');
                return;
            }

            onImport(newJobs);
            onClose();
            setJsonText('');
            setError(null);
            setPreviewCount(null);

        } catch (err) {
            console.error("JSON Parse Error:", err);
            setError('Invalid JSON syntax. Please check your formatting.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface-highlight">
                    <div>
                        <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-500" />
                            Import JSON
                        </h2>
                        <p className="text-sm text-text-muted">Paste your job data JSON array below</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-6 h-6 text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                    <div className="flex-1 relative">
                        <textarea
                            className="w-full h-64 md:h-96 p-4 bg-background border border-border rounded-xl font-mono text-xs md:text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder='[
  {
    "campaign_name": "January Newsletter",
    "property": "Lincoln",
    "in_home_date": "2026-01-15",
    ...
  }
]'
                            value={jsonText}
                            onChange={handleTextChange}
                            spellCheck={false}
                        />
                        {previewCount !== null && (
                            <div className="absolute bottom-4 right-4 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {previewCount} job{previewCount !== 1 ? 's' : ''} detected
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 dark:text-red-300 font-medium">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-surface flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-text-muted hover:text-text-main font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={!jsonText.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        <Upload className="w-4 h-4" />
                        Import Jobs
                    </button>
                </div>
            </div>
        </div>
    );
}
