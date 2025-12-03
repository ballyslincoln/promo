import React from 'react';
import { Check, TrendingUp, TrendingDown } from 'lucide-react';

interface PostageSelectorProps {
    postage: string;
    quantity: number;
    onChange: (value: string) => void;
}

const RATES = {
    Standard: 0.35,
    'First Class': 0.457
};

export default function PostageSelector({ postage, quantity, onChange }: PostageSelectorProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    const standardCost = quantity * RATES.Standard;
    const firstClassCost = quantity * RATES['First Class'];
    const difference = firstClassCost - standardCost;

    return (
        <div className="space-y-3">
            <label className="block text-xs font-medium text-text-muted">Postage Class & Cost</label>
            <div className="grid grid-cols-1 gap-3">
                {/* Standard Option */}
                <button
                    type="button"
                    onClick={() => onChange('Standard')}
                    className={`relative flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        postage === 'Standard'
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                            : 'border-border hover:border-blue-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${postage === 'Standard' ? 'text-blue-600 dark:text-blue-400' : 'text-text-main'}`}>
                                Standard
                            </span>
                            {postage === 'Standard' && <Check className="w-4 h-4 text-blue-500" />}
                        </div>
                        <span className="text-xs text-text-muted">Rate: ${RATES.Standard}/pc</span>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-text-main">{formatCurrency(standardCost)}</div>
                        {postage === 'First Class' && (
                            <div className="text-[10px] font-medium text-green-600 flex items-center justify-end gap-1">
                                <TrendingDown className="w-3 h-3" />
                                Save {formatCurrency(difference)}
                            </div>
                        )}
                    </div>
                </button>

                {/* First Class Option */}
                <button
                    type="button"
                    onClick={() => onChange('First Class')}
                    className={`relative flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        postage === 'First Class'
                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/20 shadow-sm'
                            : 'border-border hover:border-orange-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${postage === 'First Class' ? 'text-orange-600 dark:text-orange-400' : 'text-text-main'}`}>
                                First Class
                            </span>
                            {postage === 'First Class' && <Check className="w-4 h-4 text-orange-500" />}
                        </div>
                        <span className="text-xs text-text-muted">Rate: ${RATES['First Class']}/pc</span>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-text-main">{formatCurrency(firstClassCost)}</div>
                        {postage === 'Standard' && quantity > 0 && (
                            <div className="text-[10px] font-medium text-orange-600 flex items-center justify-end gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +{formatCurrency(difference)}
                            </div>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
}
