import { Head } from '@inertiajs/react';
import { BookOpen, ExternalLink } from 'lucide-react';
import SurfaceLayout from '@/components/surface-layout';

interface Props {
    brandname: string;
    logo: string | null;
    pdfUrl: string;
}

export default function PublicUserManualPage({ brandname, logo, pdfUrl }: Props) {
    return (
        <SurfaceLayout brandname={brandname} logo={logo}>
            <Head title={`User Manual & Operations Guide - ${brandname}`} />

            {/* Embedded PDF Viewer */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[78vh]">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2 font-medium">
                            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Standard Operating Procedure & Policy Manual</span>
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
        </SurfaceLayout>
    );
}
