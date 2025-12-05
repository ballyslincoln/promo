import { MessageSquarePlus } from 'lucide-react';

interface FooterProps {
  onAdminOpen?: () => void;
  onPrivacyClick?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'glass';
}

export default function Footer({ onAdminOpen, onPrivacyClick, className = '', variant = 'default' }: FooterProps) {
  const baseStyles = "relative z-50 py-6 px-4 mt-auto transition-all duration-300";
  
  const variants = {
    default: "border-t border-border bg-surface/50 backdrop-blur-sm pb-safe-bottom",
    minimal: "bg-transparent border-none pb-safe-bottom opacity-80 hover:opacity-100",
    glass: "bg-white/10 dark:bg-black/10 backdrop-blur-md border-t border-white/10 pb-safe-bottom"
  };

  return (
    <footer className={`${baseStyles} ${variants[variant]} ${className}`}>
        <div className="max-w-3xl mx-auto text-center space-y-3">
            <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">
                Created by Regional Advertising Manager Jackson Kelly
            </p>
            <p className="text-[10px] text-text-light uppercase tracking-widest">
                &copy; Bally's Corporation {new Date().getFullYear()} All Rights Reserved
            </p>
             <div className="pt-2 flex items-center justify-center gap-3 text-[9px] text-text-light/70 font-mono uppercase tracking-wider">
                <button onClick={onPrivacyClick} className="hover:text-text-main transition-colors underline decoration-dotted underline-offset-2">
                    Privacy Policy & Legal Notice
                </button>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3 text-[9px] text-text-light/70 font-mono uppercase tracking-wider">
                <span>v8.4</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>Created in Lincoln, RI</span>
            </div>

            <div className="flex justify-center mt-4">
                <a
                    href="mailto:jkelly@ballyslincoln.com?subject=Feature Suggestion Ballys App"
                    className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-border rounded-xl text-[10px] font-bold text-text-main hover:text-ballys-red uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 group"
                >
                    <MessageSquarePlus className="w-3.5 h-3.5 text-text-muted group-hover:text-ballys-red transition-colors" />
                    Suggest a Feature
                </a>
            </div>

            {onAdminOpen && (
                <button
                    onClick={onAdminOpen}
                    className="mt-4 px-3 py-1 bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-border rounded-full text-[9px] font-bold text-text-light hover:text-text-muted uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                    Admin Access
                </button>
            )}
        </div>
    </footer>
  );
}
