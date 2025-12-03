import { useState, useEffect } from 'react';
import { X, Calendar, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, setDate, parseISO, addMonths } from 'date-fns';
import { JOB_TEMPLATES } from './jobTemplates';
import type { JobTemplate } from './jobTemplates';
import type { MailJob } from '../../services/dropSheetService';
import PostageSelector from './PostageSelector';
import { subtractBusinessDays } from './dateUtils';

interface AddJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (job: MailJob) => void;
    currentMonth: Date;
}

export default function AddJobModal({ isOpen, onClose, onAdd, currentMonth }: AddJobModalProps) {
    const [property, setProperty] = useState<'Lincoln' | 'Tiverton'>('Lincoln');
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
    const [targetMonth, setTargetMonth] = useState<Date>(currentMonth);
    
    // Form state
    const [campaignName, setCampaignName] = useState('');
    const [jobNumber, setJobNumber] = useState('');
    const [mailType, setMailType] = useState('Core/Newsletter');
    const [postage, setPostage] = useState('Standard');
    const [quantity, setQuantity] = useState(0);
    const [inHomeDate, setInHomeDate] = useState('');
    const [vendorMailDate, setVendorMailDate] = useState(''); // Drop Date
    const [artDueDate, setArtDueDate] = useState(''); // Calculated but stored in milestones?
    // The prompt mentions "Art Due = Mail Drop Date - 5 Business Days" but MailJob interface doesn't have art_due_date.
    // It has milestones. I'll add it to milestones.

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            if (JOB_TEMPLATES?.[property]) {
                const categories = Object.keys(JOB_TEMPLATES[property]);
                if (categories.length > 0) {
                    setActiveCategory(categories[0]);
                }
            }
            setTargetMonth(currentMonth);
            setSelectedTemplate(null);
            setCampaignName('');
            setJobNumber('');
            setMailType('Core/Newsletter');
            setPostage('Standard');
            setQuantity(0);
            setInHomeDate('');
            setVendorMailDate('');
            setArtDueDate('');
        }
    }, [isOpen, property]); // Reset when property changes too

    // Update categories when property changes
    useEffect(() => {
        const categories = Object.keys(JOB_TEMPLATES?.[property] || {});
        if (categories.length > 0 && !categories.includes(activeCategory)) {
            setActiveCategory(categories[0]);
        }
    }, [property]);

    if (!isOpen) return null;

    const applyTemplateToMonth = (template: JobTemplate, month: Date) => {
        // 1. Name Interpolation
        const monthName = format(month, 'MMMM');
        const interpolatedName = template.namePattern.replace('{Month}', monthName);
        setCampaignName(interpolatedName);

        // 2. Set basic fields
        setMailType(template.type);
        setPostage(template.postage);

        // 3. Date Math
        // In-Home Date = [Target Month] + defaultInHomeDay
        // We need to ensure we're working with the correct month/year
        const targetDate = setDate(month, template.defaultInHomeDay);
        const inHomeStr = format(targetDate, 'yyyy-MM-dd');
        setInHomeDate(inHomeStr);

        // Mail Drop Date = In-Home Date - 10 Business Days
        const dropDate = subtractBusinessDays(targetDate, 10);
        setVendorMailDate(format(dropDate, 'yyyy-MM-dd'));

        // Art Due = Mail Drop Date - 5 Business Days
        const artDate = subtractBusinessDays(dropDate, 5);
        setArtDueDate(format(artDate, 'yyyy-MM-dd'));
    };

    const handleTemplateSelect = (template: JobTemplate) => {
        setSelectedTemplate(template);
        applyTemplateToMonth(template, targetMonth);
    };

    const handleMonthChange = (offset: number) => {
        const newMonth = addMonths(targetMonth, offset);
        setTargetMonth(newMonth);
        if (selectedTemplate) {
            applyTemplateToMonth(selectedTemplate, newMonth);
        }
    };

    const handleSubmit = () => {
        const newJob: MailJob = {
            id: crypto.randomUUID(),
            campaign_name: campaignName,
            job_number: jobNumber,
            mail_type: mailType,
            property: property,
            job_submitted: false,
            postage: postage,
            quantity: quantity,
            in_home_date: inHomeDate,
            first_valid_date: '', // Not specified in calculation, leave empty or default?
            vendor_mail_date: vendorMailDate,
            milestones: {
                creative_approved: artDueDate // Using creative_approved as proxy for Art Due or maybe we should add a custom field?
                // The interface has `creative_received`, `creative_approved`. 
                // "Art Due" usually means when creative needs to be ready. 
                // I'll map it to `creative_received` as a target date? 
                // Or just leave it out of the top-level object if there's no field.
                // The prompt says "Deliverables: ... Update the AddJobModal".
                // I'll store it in milestones.data_approved for now or just not store it if not needed by backend.
                // Let's assume `creative_approved` is the deadline for Art.
            },
            created_at: new Date().toISOString()
        };
        onAdd(newJob);
        onClose();
    };

    const categories = Object.keys(JOB_TEMPLATES?.[property] || {});

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface-highlight">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">New Job Wizard</h2>
                        <p className="text-sm text-text-muted">Select a template to auto-fill campaign details</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-6 h-6 text-text-muted" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Left Sidebar - Template Selection */}
                    <div className="w-1/3 border-r border-border bg-surface flex flex-col">
                        {/* Property Toggle */}
                        <div className="p-4 border-b border-border">
                            <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                <button 
                                    onClick={() => setProperty('Lincoln')}
                                    className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                                        property === 'Lincoln' 
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' 
                                        : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    Lincoln
                                </button>
                                <button 
                                    onClick={() => setProperty('Tiverton')}
                                    className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                                        property === 'Tiverton' 
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600' 
                                        : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    Tiverton
                                </button>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="flex-1 overflow-y-auto">
                            {categories.map(category => (
                                <div key={category} className="mb-2">
                                    <div 
                                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-muted sticky top-0 bg-surface border-y border-transparent z-10 ${
                                            activeCategory === category ? 'text-text-main bg-gray-50 dark:bg-slate-800' : ''
                                        }`}
                                    >
                                        {category}
                                    </div>
                                    <div className="px-2">
                                        {JOB_TEMPLATES?.[property]?.[category]?.map((template, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleTemplateSelect(template)}
                                                className={`w-full text-left p-2 rounded-lg mb-1 transition-all group relative ${
                                                    selectedTemplate === template 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                                                }`}
                                            >
                                                <div className="font-medium text-sm text-text-main">{template.label}</div>
                                                <div className="text-xs text-text-muted mt-1 flex items-center justify-between">
                                                    <span>{template.type}</span>
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                                                        <ChevronRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                                {selectedTemplate === template && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content - Form */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50 p-8">
                        {selectedTemplate ? (
                            <div className="space-y-6 max-w-lg mx-auto">
                                
                                {/* Summary Card */}
                                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Campaign Configuration</h3>
                                        
                                        {/* Month Selector */}
                                        <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
                                            <button 
                                                onClick={() => handleMonthChange(-1)}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-text-muted" />
                                            </button>
                                            <div className="px-3 min-w-[100px] text-center">
                                                <span className="text-xs font-bold text-text-main">
                                                    {format(targetMonth, 'MMM yyyy')}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleMonthChange(1)}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4 text-text-muted" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="col-span-1">
                                                <label className="block text-xs font-medium text-text-muted mb-1">Job #</label>
                                                <input 
                                                    type="text" 
                                                    value={jobNumber}
                                                    onChange={(e) => setJobNumber(e.target.value)}
                                                    className="w-full p-2 bg-background border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="#"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-medium text-text-muted mb-1">Campaign Name</label>
                                                <input 
                                                    type="text" 
                                                    value={campaignName}
                                                    onChange={(e) => setCampaignName(e.target.value)}
                                                    className="w-full p-2 bg-background border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-text-muted mb-1">Mail Type</label>
                                                <select 
                                                    value={mailType}
                                                    onChange={(e) => setMailType(e.target.value)}
                                                    className="w-full p-2 bg-background border border-border rounded-lg text-sm outline-none"
                                                >
                                                    <option value="Core/Newsletter">Core/Newsletter</option>
                                                    <option value="6x9 Postcard">6x9 Postcard</option>
                                                    <option value="Tri-Fold">Tri-Fold</option>
                                                    <option value="Bi-Fold">Bi-Fold</option>
                                                </select>
                                            </div>
                                            <div>
                                                 <label className="block text-xs font-medium text-text-muted mb-1">Quantity</label>
                                                 <input 
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                                    className="w-full p-2 bg-background border border-border rounded-lg text-sm outline-none"
                                                />
                                            </div>
                                        </div>

                                        <PostageSelector 
                                            postage={postage} 
                                            quantity={quantity} 
                                            onChange={setPostage} 
                                        />
                                    </div>
                                </div>

                                {/* Schedule Card */}
                                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Schedule Calculation
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                                <label className="block text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">In-Home Target</label>
                                                <input 
                                                    type="date" 
                                                    value={inHomeDate}
                                                    onChange={(e) => setInHomeDate(e.target.value)}
                                                    className="w-full bg-transparent text-sm font-bold text-blue-900 dark:text-blue-100 outline-none"
                                                />
                                            </div>
                                            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800">
                                                <label className="block text-xs font-medium text-orange-800 dark:text-orange-300 mb-1">Drop Date (Calc)</label>
                                                <input 
                                                    type="date" 
                                                    value={vendorMailDate}
                                                    onChange={(e) => setVendorMailDate(e.target.value)}
                                                    className="w-full bg-transparent text-sm font-bold text-orange-900 dark:text-orange-100 outline-none"
                                                />
                                                <div className="text-[10px] text-orange-600/70 mt-1">~10 biz days prior</div>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-border flex justify-between items-center">
                                            <div>
                                                <label className="block text-xs font-medium text-text-muted">Art Due (Calc)</label>
                                                <div className="text-sm font-medium text-text-main">
                                                    {artDueDate ? format(parseISO(artDueDate), 'MMM d, yyyy') : '-'}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-text-muted">~5 biz days before drop</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        onClick={handleSubmit}
                                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-5 h-5" />
                                        Create Job
                                    </button>
                                </div>

                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted/50">
                                <div className="w-16 h-16 rounded-full bg-surface border-2 border-dashed border-border flex items-center justify-center mb-4">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <p className="text-lg font-medium">Select a template to get started</p>
                                <p className="text-sm">Choose a category from the left menu</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
