import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import {
    Users,
    ArrowLeft,
    Search,
    ShieldCheck,
    Trash2,
    RefreshCw,
    Store,
    Building2,
    Calendar,
    Phone,
    CheckCircle2,
    Clock,
    Copy,
} from 'lucide-react';
import { showConfirm, showSuccess, showError, showToast } from '@/lib/swal';

interface EmployeeItem {
    id: number;
    uid: string;
    name: string;
    phone: string;
    role: string;
    salary: string;
    working_hours: string;
    check_in_time: string;
    check_out_time: string;
    joining_date: string;
    image: string | null;
    status: number;
    device_token_expires_at: string | null;
    verification_token: string | null;
    outlet: {
        id: number;
        name: string;
        uid: string;
    } | null;
    attendances_count: number;
}

interface Props {
    store: {
        id: number;
        uid: string;
        store_id: string;
        name: string;
        email: string;
        max_outlets: number;
        outlets_count: number;
        employees_count: number;
        storage_formatted: string;
    };
    employees: {
        data: EmployeeItem[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        search: string;
        status: string;
    };
    currencySymbol?: string;
}

export default function StoreEmployees({ store, employees, filters, currencySymbol = 'BDT' }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            `/super-admin/stores/${store.id}/employees`,
            { search: searchTerm, status: statusFilter },
            { preserveState: true }
        );
    };

    const handleResetVerification = async (emp: EmployeeItem) => {
        const confirmed = await showConfirm(
            'Reset Device & Re-verify?',
            `This will immediately invalidate the current device binding for ${emp.name} and generate a fresh verification link.`,
            'Yes, reset device'
        );

        if (confirmed) {
            router.post(`/super-admin/stores/${store.id}/employees/${emp.id}/reset-verification`);
        }
    };

    const handleDeleteEmployee = async (emp: EmployeeItem) => {
        const confirmed = await showConfirm(
            `Delete Employee ${emp.name}?`,
            `Permanently delete ${emp.name} and their attendance history from ${store.name}?`,
            'Yes, delete employee',
            'warning'
        );

        if (confirmed) {
            router.delete(`/super-admin/stores/${store.id}/employees/${emp.id}`);
        }
    };

    const copyLink = (token: string | null) => {
        if (!token) {
            showError('Active Device', 'This employee already has a verified device. Click "Re-verify" to issue a new verification link.');
            return;
        }

        const link = `${window.location.origin}/verify/${token}`;
        navigator.clipboard.writeText(link);
        showToast('Verification link copied to clipboard!', 'success');
    };

    return (
        <SuperAdminLayout title={`${store.name} - Employees`}>
            <Head title={`${store.name} Employees - Super Admin`} />

            {/* Back Link & Header */}
            <div className="space-y-4">
                <Link
                    href="/super-admin/stores"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Stores Directory</span>
                </Link>

                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {store.name}
                            </h1>
                            <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-lg">
                                {store.store_id || store.uid}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Admin Contact: <strong className="text-slate-700 dark:text-slate-300">{store.email}</strong> &bull; Storage: <strong className="font-mono text-purple-600 dark:text-purple-400">{store.storage_formatted}</strong>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-medium">Outlets</span>
                            <span className="font-bold text-slate-900 dark:text-white">{store.outlets_count} / {store.max_outlets}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 block font-medium">Total Staff</span>
                            <span className="font-bold text-slate-900 dark:text-white">{employees.total}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search employees by name, role, phone, or UID..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            router.get(
                                `/super-admin/stores/${store.id}/employees`,
                                { search: searchTerm, status: e.target.value },
                                { preserveState: true }
                            );
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="1">Active / Verified</option>
                        <option value="0">Pending Device Verification</option>
                    </select>

                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        Filter
                    </button>
                </form>
            </div>

            {/* Employee Table */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="py-3.5 pl-6">Employee</th>
                                <th className="py-3.5 px-4">Assigned Outlet</th>
                                <th className="py-3.5 px-4">Role & Contact</th>
                                <th className="py-3.5 px-4">Shift & Hours</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {employees.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        No employee profiles found in this store.
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0 overflow-hidden">
                                                    {emp.image ? (
                                                        <img
                                                            src={emp.image.startsWith('http') || emp.image.startsWith('/') ? emp.image : `/storage/${emp.image}`}
                                                            alt={emp.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        emp.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white text-sm">
                                                        {emp.name}
                                                    </div>
                                                    <div className="font-mono text-[11px] text-slate-400">
                                                        {emp.uid}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            {emp.outlet ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                                                    <Building2 className="h-3 w-3 text-slate-400" />
                                                    {emp.outlet.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">No Outlet Assigned</span>
                                            )}
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="font-medium text-slate-800 dark:text-slate-200">
                                                {emp.role}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono">
                                                {emp.phone}
                                            </div>
                                        </td>

                                        <td className="py-4 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                            {emp.check_in_time.substring(0, 5)} - {emp.check_out_time.substring(0, 5)}
                                            <span className="block text-[10px] text-slate-400">({emp.working_hours}h daily &bull; {currencySymbol} {Number(emp.salary).toLocaleString()})</span>
                                        </td>

                                        <td className="py-4 px-4">
                                            {emp.status === 1 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Active Device
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                                                    <Clock className="h-3 w-3" />
                                                    Pending Bind
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {emp.verification_token ? (
                                                    <button
                                                        onClick={() => copyLink(emp.verification_token)}
                                                        className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="Copy Device Verification Link"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                        <span>Copy Link</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleResetVerification(emp)}
                                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                        title="Reset Device Binding"
                                                    >
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                        <span>Re-verify</span>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleDeleteEmployee(emp)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Employee"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </SuperAdminLayout>
    );
}

