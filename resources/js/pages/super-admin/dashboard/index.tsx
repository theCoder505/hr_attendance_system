import { Head, Link } from '@inertiajs/react';
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
} from 'lucide-react';

interface StoreData {
    id: number;
    uid: string;
    store_id: string;
    name: string;
    email: string;
    max_outlets: number;
    outlets_count: number;
    employees_count: number;
    storage_bytes: number;
    storage_formatted: string;
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
    stores: StoreData[];
    recentInquiries: InquiryData[];
}

export default function SuperAdminDashboard({ metrics, stores, recentInquiries }: Props) {
    // Find highest storage bytes for relative bar calculation
    const maxStoreStorage = Math.max(...stores.map((s) => s.storage_bytes), 1024 * 1024);

    return (
        <SuperAdminLayout title="Super Admin Dashboard">
            <Head title="Platform Control Center - Super Admin" />

            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 dark:bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/40 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/10 border border-purple-900/20 text-purple-900 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400 text-xs font-semibold mb-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Platform Administration & Storage Analytics</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Multi-Store Attendance Overview
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Manage store tenant boundaries, outlet quotas, and inspect storage space usage in real time.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/super-admin/stores"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/25 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add New Store</span>
                    </Link>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Stores */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Stores</span>
                        <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Store className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                            {metrics.total_stores}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Active tenant accounts
                        </p>
                    </div>
                </div>

                {/* Total Outlets */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Outlets</span>
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                            {metrics.total_outlets}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Physical branches across stores
                        </p>
                    </div>
                </div>

                {/* Total Employees */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Employees</span>
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                            {metrics.total_employees}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Registered staff profiles
                        </p>
                    </div>
                </div>

                {/* Total Storage Used */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Storage Used</span>
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <HardDrive className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                            {metrics.total_storage_formatted}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            Photos, letters & assets
                        </p>
                    </div>
                </div>
            </div>

            {/* Attendance Activity Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <CalendarCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attendances Today</span>
                            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {metrics.attendances_today} Records
                            </div>
                        </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                        Live Daily Activity
                    </span>
                </div>

                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Contact Inquiries</span>
                            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                {metrics.pending_inquiries} New Messages
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/super-admin/inquiries"
                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                        <span>View Inquiries</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            {/* Store Storage Usage & Outlet Quota Breakdown */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-purple-500" />
                            Store Storage & Usage Analytics
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Detailed breakdown of how much total storage space each store/admin is consuming.
                        </p>
                    </div>

                    <Link
                        href="/super-admin/stores"
                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                        <span>Manage All Stores</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="py-3.5 pl-6">Store Name & ID</th>
                                <th className="py-3.5 px-4">Admin Email</th>
                                <th className="py-3.5 px-4">Outlet Quota</th>
                                <th className="py-3.5 px-4">Staff Count</th>
                                <th className="py-3.5 px-4">Total Storage Used</th>
                                <th className="py-3.5 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {stores.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        No stores registered yet.
                                    </td>
                                </tr>
                            ) : (
                                stores.map((store) => {
                                    const outletPct = Math.min(100, Math.round((store.outlets_count / store.max_outlets) * 100));
                                    const storagePct = Math.min(100, Math.max(5, Math.round((store.storage_bytes / maxStoreStorage) * 100)));

                                    return (
                                        <tr key={store.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 pl-6">
                                                <div className="font-semibold text-slate-900 dark:text-white text-sm">
                                                    {store.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/60">
                                                        {store.store_id || store.uid}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                                                {store.email}
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {store.outlets_count} / {store.max_outlets}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">outlets</span>
                                                </div>
                                                <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            outletPct >= 100 ? 'bg-rose-500' : 'bg-indigo-600'
                                                        }`}
                                                        style={{ width: `${outletPct}%` }}
                                                    />
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                                                    <Users className="h-3 w-3 text-slate-400" />
                                                    {store.employees_count} staff
                                                </span>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="font-mono font-bold text-slate-900 dark:text-white">
                                                    {store.storage_formatted}
                                                </div>
                                                <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full"
                                                        style={{ width: `${storagePct}%` }}
                                                    />
                                                </div>
                                            </td>

                                            <td className="py-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/super-admin/stores/${store.id}/employees`}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                                                    >
                                                        Employees
                                                    </Link>
                                                    <Link
                                                        href="/super-admin/stores"
                                                        className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold text-xs transition-colors"
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
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-indigo-500" />
                            Recent Store Expansion Inquiries
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Prospective store owners who submitted inquiries through the surface website contact form.
                        </p>
                    </div>

                    <Link
                        href="/super-admin/inquiries"
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
                                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start justify-between gap-3"
                            >
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                                        {inq.company_name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                        {inq.subject}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                                        {inq.email} &bull; {inq.total_outlets} Outlets
                                    </div>
                                </div>

                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        inq.status === 'replied'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                            : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
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

