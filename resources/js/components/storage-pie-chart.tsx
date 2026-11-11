import { useState } from 'react';
import { HardDrive, AlertTriangle, CheckCircle2, FileText, CalendarCheck, Database } from 'lucide-react';

export interface StorageSlice {
    id: string;
    label: string;
    bytes: number;
    formatted: string;
    percentage: number;
    color: string;
    count?: number | null;
    unit?: string | null;
}

export interface StorageDetails {
    media_bytes: number;
    media_formatted: string;
    media_files_count: number;
    attendance_bytes: number;
    attendance_formatted: string;
    attendance_count: number;
    db_bytes: number;
    db_formatted: string;
    db_records_count: number;
    total_bytes: number;
    total_formatted: string;
    max_storage_mb: number;
    max_storage_bytes: number;
    max_storage_formatted: string;
    remaining_bytes: number;
    remaining_formatted: string;
    used_percentage: number;
    is_limit_reached: boolean;
    chart_slices: StorageSlice[];
}

interface Props {
    storageDetails: StorageDetails;
    className?: string;
}

export default function StoragePieChart({ storageDetails, className = '' }: Props) {
    const [hoveredSlice, setHoveredSlice] = useState<StorageSlice | null>(null);

    const slices = storageDetails?.chart_slices || [];
    const usedPercentage = storageDetails?.used_percentage || 0;
    const isExceeded = storageDetails?.is_limit_reached || usedPercentage >= 100;
    const isWarning = usedPercentage >= 80 && !isExceeded;

    // SVG Circle Parameters for Donut Chart
    const radius = 68;
    const circumference = 2 * Math.PI * radius; // ~427.256

    // Pre-calculate stroke offsets
    let cumulativeOffset = 0;
    const renderedSlices = slices.map((slice) => {
        // Enforce visible minimum segment length if slice has bytes but percentage is rounded to 0
        const effectivePct = slice.percentage > 0 ? slice.percentage : (slice.bytes > 0 ? 0.35 : 0);
        const dashLength = (effectivePct / 100) * circumference;
        const offset = cumulativeOffset;
        cumulativeOffset += dashLength;

        return {
            ...slice,
            dashLength,
            offset,
        };
    });

    const getIconForSlice = (id: string) => {
        switch (id) {
            case 'media':
                return <FileText className="h-4 w-4 text-purple-500" />;
            case 'attendance':
                return <CalendarCheck className="h-4 w-4 text-blue-500" />;
            case 'database':
                return <Database className="h-4 w-4 text-emerald-500" />;
            default:
                return <CheckCircle2 className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className={`bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm ${className}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center">
                        <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Store Data Storage Usage</span>
                            {isExceeded ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                                    <AlertTriangle className="h-3 w-3" /> Storage Full
                                </span>
                            ) : isWarning ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                    <AlertTriangle className="h-3 w-3" /> Near Limit
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" /> Healthy Quota
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Real-time breakdown of all uploaded media, attendance logs, and database records.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/60 dark:to-indigo-950/60 px-4 py-2 rounded-2xl border border-purple-200/80 dark:border-purple-800/80 shadow-sm">
                    <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">Allocated Quota:</span>
                    <span className="text-xs font-extrabold font-mono text-purple-700 dark:text-purple-200">
                        {storageDetails.max_storage_formatted} ({storageDetails.max_storage_mb} MB)
                    </span>
                </div>
            </div>

            {/* Content: Pie Chart + Breakdown Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-6">
                {/* SVG Donut / Pie Chart (Col 5) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center">
                    <div className="relative w-52 h-52 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
                            {/* Background Track */}
                            <circle
                                cx="90"
                                cy="90"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="24"
                                fill="transparent"
                                className="text-slate-100 dark:text-slate-800/80"
                            />

                            {/* Rendered Colored Slices */}
                            {renderedSlices.map((slice) => {
                                if (slice.dashLength <= 0) return null;
                                const isHovered = hoveredSlice?.id === slice.id;

                                return (
                                    <circle
                                        key={slice.id}
                                        cx="90"
                                        cy="90"
                                        r={radius}
                                        stroke={slice.color}
                                        strokeWidth={isHovered ? 28 : 24}
                                        strokeDasharray={`${slice.dashLength} ${circumference - slice.dashLength}`}
                                        strokeDashoffset={-slice.offset}
                                        strokeLinecap="butt"
                                        fill="transparent"
                                        className="transition-all duration-300 cursor-pointer opacity-95 hover:opacity-100"
                                        onMouseEnter={() => setHoveredSlice(slice)}
                                        onMouseLeave={() => setHoveredSlice(null)}
                                    />
                                );
                            })}
                        </svg>

                        {/* Center Label inside Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                            {hoveredSlice ? (
                                <>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[120px]">
                                        {hoveredSlice.label}
                                    </span>
                                    <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                                        {hoveredSlice.formatted}
                                    </span>
                                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                                        {hoveredSlice.percentage}%
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Total Used
                                    </span>
                                    <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                                        {storageDetails.total_formatted}
                                    </span>
                                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                                        {usedPercentage}% of limit
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                        Hover slices to see category details
                    </span>
                </div>

                {/* Data Categories & Detailed Breakdown (Col 7) */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                    {/* Metric Quick Stats */}
                    <div className="grid grid-cols-3 gap-2.5 mb-1">
                        <div className="bg-gradient-to-br from-purple-50/80 via-white to-purple-100/30 dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 border border-purple-200/80 dark:border-purple-800/60 p-3 rounded-2xl shadow-sm">
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Used</span>
                            <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 truncate">
                                {storageDetails.total_formatted}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-100/30 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 p-3 rounded-2xl shadow-sm">
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Remaining</span>
                            <div className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                                {storageDetails.remaining_formatted}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-sky-100/30 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 p-3 rounded-2xl shadow-sm">
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Max Limit</span>
                            <div className="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                                {storageDetails.max_storage_formatted}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar of Total Usage */}
                    <div className="space-y-1.5 py-1">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-600 dark:text-slate-300">Total Consumption</span>
                            <span className="font-mono text-purple-600 dark:text-purple-400">{usedPercentage}% Used</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                            {renderedSlices.map((slice) => {
                                if (slice.id === 'available' || slice.percentage <= 0) return null;
                                return (
                                    <div
                                        key={slice.id}
                                        style={{ width: `${Math.max(slice.percentage, 0.5)}%`, backgroundColor: slice.color }}
                                        className="h-full transition-all duration-300"
                                        title={`${slice.label}: ${slice.formatted} (${slice.percentage}%)`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Detail Rows */}
                    <div className="space-y-2 mt-1">
                        {slices.map((slice) => {
                            const isHovered = hoveredSlice?.id === slice.id;
                            const isAvail = slice.id === 'available';

                            return (
                                <div
                                    key={slice.id}
                                    onMouseEnter={() => setHoveredSlice(slice)}
                                    onMouseLeave={() => setHoveredSlice(null)}
                                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                                        isHovered
                                            ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800'
                                            : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="h-3 w-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: slice.color }}
                                        />
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {getIconForSlice(slice.id)}
                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                {slice.label}
                                            </span>
                                            {slice.count !== null && slice.count !== undefined && (
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    ({slice.count} {slice.unit})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                            {slice.formatted}
                                        </span>
                                        <span
                                            className={`text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full ${
                                                isAvail
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                                            }`}
                                        >
                                            {slice.percentage}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

