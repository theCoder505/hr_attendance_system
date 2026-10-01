import React, { useRef } from 'react';
import { FileText, Upload, X, CheckCircle, RefreshCw, FileCheck } from 'lucide-react';

interface FileUploadPreviewProps {
    id?: string;
    label?: string;
    currentFileUrl?: string | null;
    currentFileName?: string;
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    accept?: string;
    helperText?: string;
    error?: string | null;
    className?: string;
    required?: boolean;
}

export default function FileUploadPreview({
    id,
    label,
    currentFileUrl,
    currentFileName = 'Current Document (PDF)',
    selectedFile,
    onFileChange,
    accept = '.pdf,application/pdf',
    helperText,
    error,
    className = '',
    required = false,
}: FileUploadPreviewProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File | undefined | null) => {
        if (!file) {
            onFileChange(null);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }
        onFileChange(file);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <div className="flex items-center justify-between">
                    <label
                        htmlFor={id}
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                        {label} {required && <span className="text-rose-500">*</span>}
                    </label>
                    {selectedFile && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            File selected
                        </span>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
            />

            {/* If a new file is selected */}
            {selectedFile ? (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                            <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {formatFileSize(selectedFile.size)} • Ready to upload
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                            title="Choose another file"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                            title="Discard file"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : currentFileUrl ? (
                /* Existing File */
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <a
                                href={currentFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                            >
                                {currentFileName}
                            </a>
                            <p className="text-[11px] text-slate-400">Currently attached file</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                    >
                        Replace
                    </button>
                </div>
            ) : (
                /* Empty Upload Dropzone */
                <div
                    onClick={() => inputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 rounded-xl p-3 flex items-center justify-center gap-2 text-center transition-all group"
                >
                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2">
                            Select PDF
                        </span>{' '}
                        {helperText ? `(${helperText})` : '(Optional)'}
                    </p>
                </div>
            )}

            {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
