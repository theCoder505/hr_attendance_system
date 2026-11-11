import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import {
    Store,
    Building2,
    Users,
    HardDrive,
    CalendarCheck,
    MessageSquare,
    ArrowUpRight,
    Sparkles,
    Plus,
    Server,
    Database,
    FileText,
    Layers,
    CheckCircle2,
    RefreshCw,
    FolderTree,
} from 'lucide-react';

interface StoreData {
    id: number;
    uid: string;
    store_id: string;
    name: string;
    email: string;
    max_outlets: number;
    max_storage_mb?: number;
    max_storage_formatted?: string;
    storage_used_percentage?: number;
    outlets_count: number;
    employees_count: number;
    storage_bytes: number;
    storage_formatted: string;
    storage_breakdown?: {
        media_formatted: string;
        attendance_formatted: string;
        db_formatted: string;
    };
    two_factor_enabled: boolean;
    created_at: string;
}

interface InquiryData {
    id: number;
    company_name: string;
    subject: string;
    email: string;
    phone: string;
    total_outlets: number;
    status: string;
    created_at: string;
}

interface StorageCategoryData {
    total_bytes: number;
    total_formatted: string;
    media_bytes?: number;
    media_formatted?: string;
    media_files_count?: number;
    attendance_bytes?: number;
    attendance_formatted?: string;
    attendance_count?: number;
    db_bytes?: number;
    db_formatted?: string;
    db_records_count?: number;
    files_bytes?: number;
    files_formatted?: string;
    node_modules_bytes?: number;
    node_modules_formatted?: string;
    vendor_bytes?: number;
    vendor_formatted?: string;
    other_files_bytes?: number;
    other_files_formatted?: string;
    percentage_of_platform: number;
}

interface StorageAnalytics {
    users_data: StorageCategoryData;
    system_data: StorageCategoryData;
    platform_total: {
        total_bytes: number;
        total_formatted: string;
    };
}

interface Props {
    metrics: {
        total_stores: number;
        total_outlets: number;
        total_employees: number;
        attendances_today: number;
        attendances_this_month: number;
        pending_inquiries: number;
        total_storage_bytes: number;
        total_storage_formatted: string;
    };
    storage_analytics?: StorageAnalytics;
    stores: StoreData[];
    recentInquiries: InquiryData[];
}

export default function SuperAdminDashboard({ metrics, storage_analytics, stores, recentInquiries }: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false);


    return (
        <SuperAdminLayout title="Super Admin Dashboard">
            <Head title="Platform Control Center - Super Admin" />

            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white shadow-xl">
                {/* Decorative background glow circles */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-pink-500/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-3 backdrop-blur-md shadow-sm">
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>Platform Administration & Storage Analytics</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                            Multi-Store Attendance Overview
                        </h1>
                        <p className="text-xs sm:text-sm text-purple-100/90 mt-1 max-w-2xl">
                            Manage store tenant boundaries, outlet quotas, and inspect real-time system and tenant storage footprints.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link
                            href="/super-admin/stores"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 hover:text-purple-800 text-xs font-bold shadow-lg shadow-purple-950/20 transition-all hover:scale-[1.02] cursor-pointer"
                        >
                            <Plus className="h-4 w-4 text-purple-700 stroke-[3]" />
                            <span>Add New Store</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Stores */}
                <div className="bg-gradient-to-br from-purple-50/80 via-white to-purple-100/30 dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 border border-purple-200/80 dark:border-purple-800/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider text-[10px]">Total Stores</span>
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center">
                            <Store className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                            {metrics.total_stores}
                        </div>
                        <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                            Active tenant accounts
                        </p>
                    </div>
                </div>

                {/* Total Outlets */}
                <div className="bg-gradient-to-br from-sky-50/80 via-white to-blue-100/30 dark:from-sky-950/30 dark:via-slate-900 dark:to-slate-900 border border-sky-200/80 dark:border-sky-800/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider text-[10px]">Total Outlets</span>
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 flex items-center justify-center">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                            {metrics.total_outlets}
                        </div>
                        <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1">
                            Physical branches across stores
                        </p>
                    </div>
                </div>

                {/* Total Employees */}
                <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-100/30 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider text-[10px]">Total Employees</span>
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                            {metrics.total_employees}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                            Registered staff profiles
                        </p>
                    </div>
                </div>

                {/* Total Platform Storage */}
                <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-100/30 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[10px]">Platform Storage</span>
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25 flex items-center justify-center">
                            <Server className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                            {storage_analytics?.platform_total?.total_formatted || metrics.total_storage_formatted}
                        </div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 truncate">
                            System ({storage_analytics?.system_data?.total_formatted || '0 B'}) + Users ({storage_analytics?.users_data?.total_formatted || '0 B'})
                        </p>
                    </div>
                </div>
            </div>

            {/* Platform Storage Section: System Data + Users Data Breakdown */}
            {storage_analytics && (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 via-sky-950/95 to-emerald-950 text-white backdrop-blur-xl p-6">
                    {/* Decorative ambient radial glows */}
                    <div className="absolute -top-24 -left-24 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-cyan-800/40">
                        <div className="flex items-center gap-3.5">
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-inner">
                                <Layers className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <span>System Data + Users Data Platform Total</span>
                                    <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                        Global Footprint
                                    </span>
                                </h2>
                                <p className="text-xs text-cyan-200/80 mt-0.5">
                                    Real-time infrastructure footprint comparing core system data vs total multi-store tenant usage.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            <button
                                type="button"
                                disabled={isRefreshing}
                                onClick={() => {
                                    setIsRefreshing(true);
                                    router.get(
                                        '/super-admin/dashboard',
                                        { refresh_storage: 1 },
                                        {
                                            preserveScroll: true,
                                            onFinish: () => setIsRefreshing(false),
                                        }
                                    );
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-slate-900/70 hover:bg-slate-800 text-cyan-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                title="Recalculate total website file size and folder tree on disk"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
                                <span>{isRefreshing ? 'Scanning Disk...' : 'Recalculate Disk Size'}</span>
                            </button>

                            <div className="flex items-center gap-2 bg-emerald-950/70 px-3.5 py-1.5 rounded-xl border border-emerald-500/40 shadow-inner">
                                <span className="text-xs font-semibold text-emerald-200">Total Platform Storage:</span>
                                <span className="text-sm font-extrabold font-mono text-emerald-300">
                                    {storage_analytics.platform_total.total_formatted}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Side-by-Side Breakdown Cards */}
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
                        {/* Users Data Card */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-md shadow-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="h-9 w-9 shrink-0 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
                                        <Users className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <span className="text-sm font-bold text-white block">Users Data Total (All Stores)</span>
                                        <span className="text-[10px] text-cyan-200/70">Store-uploaded files, employee logs & database records</span>
                                    </div>
                                </div>
                                <span className="text-xs font-bold font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
                                    {storage_analytics.users_data.total_formatted}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-cyan-400" />
                                        <span>Images & Documents</span>
                                        <span className="text-[10px] text-cyan-200/60">({storage_analytics.users_data.media_files_count || 0} files)</span>
                                    </span>
                                    <span className="font-mono font-semibold text-white">{storage_analytics.users_data.media_formatted}</span>
                                </div>

                                <div className="flex items-center justify-between text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <CalendarCheck className="h-3.5 w-3.5 text-teal-400" />
                                        <span>Attendance Records</span>
                                        <span className="text-[10px] text-cyan-200/60">({storage_analytics.users_data.attendance_count || 0} logs)</span>
                                    </span>
                                    <span className="font-mono font-semibold text-white">{storage_analytics.users_data.attendance_formatted}</span>
                                </div>

                                <div className="flex items-center justify-between text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <Database className="h-3.5 w-3.5 text-emerald-400" />
                                        <span>Store DB Records (Staff, Outlets, Invoices)</span>
                                        <span className="text-[10px] text-cyan-200/60">({storage_analytics.users_data.db_records_count || 0} records)</span>
                                    </span>
                                    <span className="font-mono font-semibold text-white">{storage_analytics.users_data.db_formatted}</span>
                                </div>

                                <div className="flex items-center justify-between text-cyan-200/70 text-[11px] pt-2 border-t border-cyan-500/20">
                                    <span>Tenant Footprint Across All Outlets</span>
                                    <span className="font-semibold text-emerald-300">Active Stores</span>
                                </div>
                            </div>
                        </div>

                        {/* System Data Card (Website Total Size: node_modules + vendor + codebase + DB) */}
                        <div className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-500/30 backdrop-blur-md shadow-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="h-9 w-9 shrink-0 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                                        <Server className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <span className="text-sm font-bold text-white block">System Data Total (Website Files & Codebase)</span>
                                        <span className="text-[10px] text-emerald-200/70">node_modules + vendor + all folders & files</span>
                                    </div>
                                </div>
                                <span className="text-xs font-bold font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
                                    {storage_analytics.system_data.total_formatted}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <FolderTree className="h-3.5 w-3.5 text-amber-400" />
                                        <span>node_modules <span className="text-[10px] text-emerald-200/60">(NPM packages)</span></span>
                                    </span>
                                    <span className="font-mono font-semibold text-white">{storage_analytics.system_data.node_modules_formatted || '0 B'}</span>
                                </div>

                                <div className="flex items-center justify-between text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <FolderTree className="h-3.5 w-3.5 text-sky-400" />
                                        <span>vendor <span className="text-[10px] text-emerald-200/60">(Composer packages)</span></span>
                                    </span>
                                    <span className="font-mono font-semibold text-white">{storage_analytics.system_data.vendor_formatted || '0 B'}</span>
                                </div>

                                <div className="flex items-center justify-between text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <HardDrive className="h-3.5 w-3.5 text-teal-400" />
                                        <span>Other Folders & Files <span className="text-[10px] text-emerald-200/60">(app, public, storage, resources)</span></span>
                                    </span>
                                    <span className="font-mono font-semibold text-white">{storage_analytics.system_data.other_files_formatted || '0 B'}</span>
                                </div>

                                <div className="flex items-center justify-between text-slate-200">
                                    <span className="flex items-center gap-1.5">
                                        <Database className="h-3.5 w-3.5 text-emerald-400" />
                                        <span>Core System Database Tables <span className="text-[10px] text-emerald-200/60">({storage_analytics.system_data.db_records_count || 0} rows)</span></span>
                                    </span>
                                    <span className="font-mono font-semibold text-white">{storage_analytics.system_data.db_formatted}</span>
                                </div>

                                <div className="flex items-center justify-between text-emerald-200/70 text-[11px] pt-2 border-t border-emerald-500/20">
                                    <span>Total Website Files on Disk: {storage_analytics.system_data.files_formatted}</span>
                                    <span className="font-semibold text-emerald-300 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Full System
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Activity Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/90 dark:border-emerald-800/70 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center">
                            <CalendarCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 text-[10px]">Attendances Today</span>
                            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {metrics.attendances_today} Records
                            </div>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/80 px-3.5 py-1.5 rounded-full shadow-sm">
                        Live Daily Activity
                    </span>
                </div>

                <div className="bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-fuchsia-950/20 border border-purple-200/90 dark:border-purple-800/70 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/25 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400 text-[10px]">Pending Inquiries</span>
                            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {metrics.pending_inquiries} New Messages
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/super-admin/inquiries"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                    >
                        <span>View Inquiries</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            {/* Store Storage Usage & Outlet Quota Breakdown */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 flex items-center justify-center">
                            <HardDrive className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>Store Storage & Quota Allocation Breakdown</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                    Live Quotas
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Granular storage space (files, attendance, database) and max limit per store tenant.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/super-admin/stores"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs transition-colors self-start sm:self-auto"
                    >
                        <span>Manage All Stores</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {/* Stores Quota Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/90 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="py-3.5 pl-6">Store Name & ID</th>
                                <th className="py-3.5 px-4">Admin Email</th>
                                <th className="py-3.5 px-4">Outlet Quota</th>
                                <th className="py-3.5 px-4">Staff Count</th>
                                <th className="py-3.5 px-4">Data Usage & Max Limit</th>
                                <th className="py-3.5 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {stores.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-slate-400">
                                        No stores registered yet.
                                    </td>
                                </tr>
                            ) : (
                                stores.map((store) => {
                                    const outletPct = Math.min(100, Math.round((store.outlets_count / store.max_outlets) * 100));

                                    return (
                                        <tr key={store.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 pl-6">
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                    {store.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/80 px-2 py-0.5 rounded-md">
                                                        {store.store_id || store.uid}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300 text-xs">
                                                {store.email}
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                        {store.outlets_count} / {store.max_outlets}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">outlets</span>
                                                </div>
                                                <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            outletPct >= 100
                                                                ? 'bg-rose-500'
                                                                : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
                                                        }`}
                                                        style={{ width: `${outletPct}%` }}
                                                    />
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 font-bold text-xs">
                                                    <Users className="h-3 w-3 text-sky-500" />
                                                    {store.employees_count} staff
                                                </span>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                                                        {store.storage_formatted}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        / {store.max_storage_formatted || `${store.max_storage_mb || 500} MB`}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                                                            (store.storage_used_percentage ?? 0) >= 90
                                                                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900'
                                                                : (store.storage_used_percentage ?? 0) >= 70
                                                                ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900'
                                                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900'
                                                        }`}
                                                    >
                                                        {store.storage_used_percentage ?? 0}%
                                                    </span>
                                                </div>

                                                <div className="w-36 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-300 ${
                                                            (store.storage_used_percentage ?? 0) >= 90
                                                                ? 'bg-rose-500'
                                                                : (store.storage_used_percentage ?? 0) >= 70
                                                                ? 'bg-amber-500'
                                                                : 'bg-gradient-to-r from-teal-500 to-indigo-500'
                                                        }`}
                                                        style={{ width: `${Math.min(100, Math.max(4, store.storage_used_percentage ?? 0))}%` }}
                                                    />
                                                </div>

                                                {store.storage_breakdown && (
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                                                        <span className="text-purple-600 dark:text-purple-400 font-medium">Files: {store.storage_breakdown.media_formatted}</span>
                                                        <span>&bull;</span>
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">Logs: {store.storage_breakdown.attendance_formatted}</span>
                                                        <span>&bull;</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">DB: {store.storage_breakdown.db_formatted}</span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/super-admin/stores/${store.id}/employees`}
                                                        className="px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/60 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs transition-colors"
                                                    >
                                                        Employees
                                                    </Link>
                                                    <Link
                                                        href="/super-admin/stores"
                                                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm shadow-purple-600/20 transition-all"
                                                    >
                                                        Edit Quota
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Inquiries Preview */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                Recent Store Expansion Inquiries
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Prospective store owners who submitted inquiries through the website contact form.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/super-admin/inquiries"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs transition-colors"
                    >
                        <span>View All & Reply</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recentInquiries.length === 0 ? (
                        <div className="col-span-2 text-center py-6 text-xs text-slate-500">
                            No contact inquiries received yet.
                        </div>
                    ) : (
                        recentInquiries.map((inq) => (
                            <div
                                key={inq.id}
                                className="p-4 rounded-2xl border border-indigo-100/80 dark:border-slate-800 bg-gradient-to-br from-slate-50/70 via-white to-indigo-50/30 dark:from-slate-950/60 dark:via-slate-900 dark:to-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-start justify-between gap-3 shadow-sm"
                            >
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                                        {inq.company_name}
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                                        {inq.subject}
                                    </div>
                                    <div className="text-[11px] text-indigo-600/80 dark:text-indigo-400 font-mono mt-1 font-semibold">
                                        {inq.email} &bull; {inq.total_outlets} Outlets
                                    </div>
                                </div>

                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                        inq.status === 'replied'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                    }`}
                                >
                                    {inq.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </SuperAdminLayout>
    );
}

