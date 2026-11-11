import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, ArrowLeft, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';

interface Props {
    brandname: string;
    logo: string | null;
    pdfUrl: string;
}

export default function PublicUserManualPage({ brandname, logo, pdfUrl }: Props) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
            <Head title={`User Manual & Operations Guide - ${brandname}`} />

            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/attendance"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition"
                            title="Back to Attendance"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        {logo ? (
                            <img src={logo} alt={brandname} className="h-8 max-w-[120px] object-contain" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                                    {brandname}
                                </span>
                            </div>
                        )}
                        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                            PDF User Manual
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href={pdfUrl}
                            download="AttendEase-User-Manual.pdf"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                        </a>
                        <Link
                            href="/contact"
                            className="hidden sm:inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                            Contact
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Embedded PDF Viewer */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[78vh]">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2 font-medium">
                            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Official Standard Operating Procedure & Guidelines</span>
                        </div>
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            <span>Open in new tab</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                    <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=0`}
                        title="User Manual PDF"
                        className="w-full flex-1 border-0 rounded-b-3xl min-h-[75vh]"
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 px-4 py-5 text-center text-xs text-slate-500 dark:border-slate-800/80">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        &copy; {new Date().getFullYear()} {brandname}. Platform User Guide & Policies.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/attendance" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Attendance Portal
                        </Link>
                        <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Contact & Inquiries
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
