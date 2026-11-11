import React, { useRef, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import { BookOpen, Upload, Download, ExternalLink, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
    pdfUrl: string;
}

export default function SuperAdminUserManualPage({ pdfUrl }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

    const { data, setData, post, processing, progress, errors, reset } = useForm({
        pdf_file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('pdf_file', file);
            setSelectedFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.pdf_file) return;

        post('/super-admin/user-manual', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSelectedFileName(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                Swal.fire({
                    icon: 'success',
                    title: 'Published!',
                    text: 'The new User Manual PDF has been uploaded and published across the platform.',
                    timer: 2500,
                    showConfirmButton: false,
                });
            },
        });
    };

    return (
        <SuperAdminLayout title="User Manual Management">
            <Head title="User Manual PDF CMS - Super Admin" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs tracking-wider uppercase">
                                <BookOpen className="w-4 h-4" />
                                Documentation Management
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Platform User Manual PDF
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                This PDF opens directly in the website footer (<code className="text-purple-600">/user-manual</code>) and inside every store owner portal (<code className="text-purple-600">/store/user-manual</code>).
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <a
                                href={pdfUrl}
                                download="AttendEase-User-Manual.pdf"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Current PDF</span>
                            </a>
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm"
                            >
                                <span>Fullscreen View</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Upload / Replace PDF Form */}
                    <form onSubmit={handleSubmit} className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-purple-600" />
                                <span>Upload Replacement PDF Manual</span>
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-950 dark:file:text-purple-300 cursor-pointer"
                            />
                            {selectedFileName && (
                                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected: {selectedFileName}
                                </p>
                            )}
                            {errors.pdf_file && (
                                <p className="text-xs text-rose-500 mt-1">{errors.pdf_file}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !data.pdf_file}
                            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                        >
                            <Upload className="w-4 h-4" />
                            {processing ? 'Uploading...' : 'Publish Replacement PDF'}
                        </button>
                    </form>
                </div>

                {/* PDF Live View */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[75vh]">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Live Published PDF Preview</span>
                        <span className="font-mono text-[11px] text-slate-400">{pdfUrl}</span>
                    </div>
                    <iframe
                        src={`${pdfUrl}#toolbar=1&navpanes=0`}
                        title="User Manual PDF Preview"
                        className="w-full flex-1 border-0 min-h-[75vh]"
                    />
                </div>
            </div>
        </SuperAdminLayout>
    );
}
