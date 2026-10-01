import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle, RefreshCw, User } from 'lucide-react';

interface ImageUploadPreviewProps {
    id?: string;
    label?: string;
    currentImageUrl?: string | null;
    selectedFile: File | null;
    onFileChange: (file: File | null) => void;
    accept?: string;
    aspectRatio?: 'square' | 'circle' | 'auto';
    helperText?: string;
    error?: string | null;
    className?: string;
    required?: boolean;
}

export default function ImageUploadPreview({
    id,
    label,
    currentImageUrl,
    selectedFile,
    onFileChange,
    accept = 'image/*,.jpeg,.jpg,.png,.webp,.gif,.svg',
    aspectRatio = 'square',
    helperText,
    error,
    className = '',
    required = false,
}: ImageUploadPreviewProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Sync preview URL whenever selectedFile changes
    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        // Read file as base64 Data URL (immune to React 18 effect cleanup/revocation)
        let active = true;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (active && e.target?.result) {
                setPreviewUrl(e.target.result as string);
            }
        };
        reader.readAsDataURL(selectedFile);

        return () => {
            active = false;
        };
    }, [selectedFile]);

    const handleFile = (file: File | undefined | null) => {
        if (!file) {
            onFileChange(null);
            setPreviewUrl(null);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        // Validate that it is an image by MIME or extension
        const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|ico)$/i.test(file.name);
        if (!isImage) {
            alert('Please select an image file (JPG, PNG, WEBP, GIF, SVG).');
            return;
        }

        // Generate immediate preview
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setPreviewUrl(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);

        onFileChange(file);

        // Reset native input value so selecting the same file again triggers onChange
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFileChange(null);
        setPreviewUrl(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Determine what to display: new preview takes precedence over current saved image
    const activeImageSrc = previewUrl || currentImageUrl || null;
    const isNewSelection = Boolean(previewUrl);

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
                    {isNewSelection && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            New Image Preview
                        </span>
                    )}
                </div>
            )}

            {/* Hidden native input */}
            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
            />

            {/* Interactive Preview Container */}
            <div
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer transition-all border-2 border-dashed rounded-2xl p-3.5 flex items-center gap-4 ${
                    isNewSelection
                        ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]'
                        : activeImageSrc
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-indigo-300 dark:hover:border-indigo-800'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20'
                }`}
            >
                {/* Thumbnail Avatar / Box */}
                <div className="relative shrink-0">
                    <div
                        className={`overflow-hidden bg-white dark:bg-slate-800 border-2 flex items-center justify-center shadow-sm ${
                            isNewSelection
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 dark:border-slate-700'
                        } ${
                            aspectRatio === 'circle'
                                ? 'w-16 h-16 sm:w-20 sm:h-20 rounded-full'
                                : 'w-16 h-16 sm:w-20 sm:h-20 rounded-xl p-1'
                        }`}
                    >
                        {activeImageSrc ? (
                            <img
                                src={activeImageSrc}
                                alt="Preview"
                                className={`w-full h-full ${
                                    aspectRatio === 'circle' ? 'object-cover' : 'object-contain'
                                }`}
                            />
                        ) : aspectRatio === 'circle' ? (
                            <User className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        )}
                    </div>

                    {/* Badge */}
                    {activeImageSrc && (
                        <span
                            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full shadow-sm whitespace-nowrap ${
                                isNewSelection
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-700 dark:bg-slate-600 text-white'
                            }`}
                        >
                            {isNewSelection ? 'Preview' : 'Current'}
                        </span>
                    )}
                </div>

                {/* Info & Actions */}
                <div className="flex-1 min-w-0">
                    {selectedFile ? (
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                {formatFileSize(selectedFile.size)} • Ready to upload
                            </p>
                        </div>
                    ) : currentImageUrl ? (
                        <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                Existing image is set
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Click below to choose a replacement
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                Click to choose photo
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {helperText || 'JPG, PNG, WEBP, GIF up to 4MB'}
                            </p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                inputRef.current?.click();
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            {activeImageSrc ? 'Change photo' : 'Select photo'}
                        </button>

                        {isNewSelection && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                                Discard
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
