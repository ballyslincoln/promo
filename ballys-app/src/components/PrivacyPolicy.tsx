import React from 'react';

export default function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background text-text-main pb-safe-bottom font-sans">
        {/* Header */}
        <div className="p-4 border-b border-border sticky top-0 bg-surface/90 backdrop-blur-md z-50 flex items-center gap-4">
             <button onClick={onBack} className="text-xs font-bold uppercase tracking-wider text-ballys-red hover:text-ballys-darkRed transition-colors">
                &larr; Back
             </button>
             <h1 className="text-xs font-bold uppercase tracking-widest text-text-muted">Privacy Policy & Legal Notice</h1>
        </div>

        <div className="max-w-2xl mx-auto p-6 space-y-8 text-sm leading-relaxed">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-xl font-bold uppercase tracking-wider text-text-main">Privacy Policy & Legal Notice</h2>
                <p className="text-xs text-text-muted">Bally’s Internal Employee Platform – https://ballys.netlify.app</p>
                <p className="text-xs text-text-muted">Effective Date: December 1, 2025 | Last Updated: December 1, 2025</p>
            </div>

            <section className="bg-ballys-red/5 border-l-4 border-ballys-red p-4 rounded-r-lg">
                <h3 className="font-bold text-ballys-red mb-2 uppercase tracking-wider text-xs">STRICTLY PRIVATE – BALLY’S EMPLOYEES ONLY</h3>
                <p className="mb-2">This is a private, internal tool created exclusively for current employees of Bally’s Corporation and its affiliates.</p>
                <p className="font-bold text-ballys-red">Non-employees are not authorized to access or use this site. If you are not a Bally’s employee, you must leave immediately and permanently.</p>
            </section>

            <section>
                <h3 className="font-bold mb-3 uppercase tracking-wider border-b border-border pb-1 text-xs text-text-muted">INTELLECTUAL PROPERTY & PATENT NOTICE</h3>
                <div className="space-y-4 text-text-main/90">
                    <p>All content, comments, data, files, and information submitted or generated on this website (“Site Data”) is and remains the exclusive property of Bally’s Corporation.</p>
                    <p>The source code, software, design, user interface, architecture, algorithms, and all underlying technology (collectively “the Software”) is and remains the exclusive property of Jackson J. Kelly.</p>
                    <p className="font-semibold">Patent Pending – The Software and certain methods and processes embodied therein are covered by one or more pending patent applications in the United States and other jurisdictions. All rights reserved.</p>
                    <p>Bally’s Corporation is granted only a limited, non-exclusive, non-transferable, revocable license to use the Software solely for internal testing and development purposes. This license may be terminated by Jackson J. Kelly at any time, with or without cause. Any commercial use, distribution, or continued deployment beyond the current phase requires a separate written agreement and payment to Jackson J. Kelly.</p>
                </div>
            </section>

            <section>
                <h3 className="font-bold mb-3 uppercase tracking-wider border-b border-border pb-1 text-xs text-text-muted">USE AT YOUR OWN RISK – COMPLETE DISCLAIMER</h3>
                <p>You access and use this prototype/development website entirely at your own risk. The site is provided “AS IS” and “WITH ALL FAULTS” without any warranties of any kind.</p>
            </section>

            <section>
                 <h3 className="font-bold mb-3 uppercase tracking-wider border-b border-border pb-1 text-xs text-text-muted">COMPLETE RELEASE, WAIVER & INDEMNIFICATION</h3>
                 <p className="mb-2">By accessing or continuing to use this site, you irrevocably and unconditionally:</p>
                 <ul className="list-disc pl-5 space-y-2 text-text-main/90">
                    <li>Release, discharge, and hold harmless Jackson J. Kelly (personally and in all capacities) from any and all claims, liability, damages, fines, or legal action of any kind whatsoever, including under GDPR, CCPA, employment, privacy, intellectual property, or any other theory;</li>
                    <li>Agree to defend and indemnify Jackson J. Kelly against any third-party claim arising from your use of the site;</li>
                    <li>Acknowledge that Jackson J. Kelly’s maximum personal liability to you is US $0.00.</li>
                 </ul>
            </section>

            <section>
                <h3 className="font-bold mb-3 uppercase tracking-wider border-b border-border pb-1 text-xs text-text-muted">GDPR / DATA PROTECTION (EEA & UK EMPLOYEES ONLY)</h3>
                <ul className="list-none space-y-2 text-text-main/90">
                    <li><span className="font-semibold">Data controller for all Site Data:</span> Bally’s Corporation</li>
                    <li>Jackson J. Kelly acts solely as a processor under Bally’s instructions and has no personal controller responsibility or liability under GDPR Article 82 or otherwise</li>
                    <li><span className="font-semibold">Legal bases:</span> Art. 6(1)(b) (employment contract) and Art. 6(1)(f) (legitimate interests)</li>
                    <li>All formal data requests must go through official Bally’s HR or Data Protection Officer channels only</li>
                </ul>
            </section>

             <section>
                <h3 className="font-bold mb-3 uppercase tracking-wider border-b border-border pb-1 text-xs text-text-muted">Governing Law & Jurisdiction</h3>
                <p>Delaware law (USA) governs all non-GDPR aspects. Exclusive venue: state and federal courts in Wilmington, Delaware.</p>
            </section>

            <section>
                <h3 className="font-bold mb-3 uppercase tracking-wider border-b border-border pb-1 text-xs text-text-muted">Contact</h3>
                <ul className="space-y-2 text-text-main/90">
                    <li><span className="font-semibold">Prototype / general inquiries:</span> <a href="mailto:privacy@ballys.netlify.app" className="text-ballys-red hover:underline">privacy@ballys.netlify.app</a> (responses not guaranteed)</li>
                    <li><span className="font-semibold">Licensing / software inquiries:</span> directed solely to Jackson J. Kelly (contact details not public)</li>
                    <li><span className="font-semibold">Formal GDPR or data requests:</span> use official Bally’s HR/DPO channels only</li>
                </ul>
            </section>

            <div className="mt-12 p-6 bg-surface rounded-xl border border-border text-center space-y-4">
                <p className="font-bold text-xs uppercase tracking-wider leading-relaxed">BY REMAINING ON OR USING THIS SITE YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD, AND VOLUNTARILY ACCEPT EVERY PROVISION ABOVE — INCLUDING JACKSON J. KELLY’S EXCLUSIVE OWNERSHIP OF THE PATENT-PENDING SOFTWARE AND YOUR COMPLETE PERSONAL RELEASE OF JACKSON J. KELLY.</p>
                <div className="text-[10px] text-text-muted space-y-1 pt-4 border-t border-border/50">
                    <p>Software © 2025 Jackson J. Kelly – Patent Pending – All Rights Reserved</p>
                    <p>Site Data © 2025 Bally’s Corporation – All Rights Reserved</p>
                </div>
            </div>
        </div>
    </div>
  );
}
