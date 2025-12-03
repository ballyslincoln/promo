import { useState, useEffect } from 'react';
import { X, Copy, Download, Check, FileText } from 'lucide-react';
import type { MailJob } from '../../services/dropSheetService';
import { format } from 'date-fns';

interface ExportJsonModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobs: MailJob[];
}

export default function ExportJsonModal({ isOpen, onClose, jobs }: ExportJsonModalProps) {
    const [jsonText, setJsonText] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Format jobs for export
            const exportData = jobs.map(job => ({
                id: job.id,
                job_number: job.job_number || null,
                campaign_name: job.campaign_name,
                mail_type: job.mail_type,
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
            }));
            
            setJsonText(JSON.stringify(exportData, null, 2));
            setCopied(false);
        }
    }, [isOpen, jobs]);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error('Failed to copy');
        }
    };

    const handleDownload = () => {
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(jsonText);
        const exportFileDefaultName = `marketing_jobs_${format(new Date(), 'yyyy-MM-dd')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface-highlight">
                    <div>
                        <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-500" />
                            Export JSON
                        </h2>
                        <p className="text-sm text-text-muted">Copy or download your job data</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-6 h-6 text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                    <div className="relative flex-1">
                        <textarea
                            className="w-full h-64 md:h-96 p-4 bg-background border border-border rounded-xl font-mono text-xs md:text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                            value={jsonText}
                            readOnly
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-surface flex justify-between items-center gap-3">
                    <div className="text-xs text-text-muted font-medium">
                        {jobs.length} job{jobs.length !== 1 ? 's' : ''} ready to export
                    </div>
                    <div className="flex gap-3">
                         <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-text-main font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Download File
                        </button>
                        <button 
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl shadow-lg transition-all font-bold text-white ${
                                copied 
                                    ? 'bg-green-500 shadow-green-900/20' 
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy to Clipboard
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
