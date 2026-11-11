import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { BookOpen, Download, ExternalLink } from 'lucide-react';

interface Props {
    pdfUrl: string;
}

export default function StoreUserManualPage({ pdfUrl }: Props) {
    return (
        <AdminLayout>
            <Head title="Store User Manual & Guide" />

            <div className="space-y-4 max-w-7xl mx-auto pb-8">
                {/* Header card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                                <BookOpen className="w-4 h-4" />
                                Store Knowledge Base & Standard Operating Procedure
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform User Manual</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Detailed step-by-step instructions on setting up outlets, adding employees, verifying QR codes, billing, and platform rules.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                <span>Open Fullscreen</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* PDF Viewer Container */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[78vh]">
                    <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=0`}
                        title="User Manual PDF Viewer"
                        className="w-full flex-1 border-0 min-h-[78vh]"
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
