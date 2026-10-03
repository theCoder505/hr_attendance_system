import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    FileSpreadsheet,
    Download,
    Search,
    Users,
} from 'lucide-react';

interface Props {
    reports: any[];
    filters: {
        month: number;
        year: number;
        search: string;
    };
    allEmployees: any[];
}

export default function ReportsIndex({ reports, filters }: Props) {
    const [month, setMonth] = useState(filters.month);
    const [year, setYear] = useState(filters.year);
    const [search, setSearch] = useState(filters.search || '');

    const handleFilterChange = (m = month, y = year, s = search) => {
        router.get(
            '/administration-control/reports',
            { month: m, year: y, search: s },
            { preserveState: true }
        );
    };

    const handleExportAll = () => {
        window.location.href = '/administration-control/reports/export';
    };

    const handleExportEmployee = (empId: number) => {
        window.location.href = `/administration-control/reports/export?employee_id=${empId}`;
    };

    const monthOptions = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    // Summary calculations across current report view
    const totalPresentDays = reports.reduce((acc, r) => acc + r.present_days, 0);
    const totalLateMinutes = reports.reduce((acc, r) => acc + r.late_total_minutes, 0);
    const totalEarlyLeaveMinutes = reports.reduce((acc, r) => acc + r.early_leave_total_minutes, 0);
    const totalOvertimeMinutes = reports.reduce((acc, r) => acc + r.overtime_total_minutes, 0);

    return (
        <AdminLayout title="Monthly Attendance Reports">
            <Head title="Monthly Reports - Attendance Management" />

            {/* Top Filter Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Month Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Month:</span>
                            <select
                                value={month}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setMonth(val);
                                    handleFilterChange(val, year, search);
                                }}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                {monthOptions.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Year Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Year:</span>
                            <select
                                value={year}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setYear(val);
                                    handleFilterChange(month, val, search);
                                }}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    handleFilterChange(month, year, e.target.value);
                                }}
                                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {/* Export All Button */}
                    <button
                        onClick={handleExportAll}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export All Logs to XLSX
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Total Present Days</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {totalPresentDays} <span className="text-xs font-normal text-slate-400">shifts</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Total Late Time</span>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {totalLateMinutes} <span className="text-xs font-normal text-slate-400">min</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Total Early Leaves</span>
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                        {totalEarlyLeaveMinutes} <span className="text-xs font-normal text-slate-400">min</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Total Overtime</span>
                    <div className="text-xl font-bold text-violet-600 dark:text-violet-400 mt-1">
                        {totalOvertimeMinutes} <span className="text-xs font-normal text-slate-400">min</span>
                    </div>
                </div>
            </div>

            {/* Summary Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                            Employee Performance Summary
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Period: {monthOptions.find((m) => m.value === month)?.label} {year}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                                <th className="py-3.5 pl-4">
                                    <div className="min-w-50 text-left">Employee</div>
                                </th>
                                <th className="py-3.5">
                                    <div className="min-w-40 text-center">Days Present</div>
                                </th>
                                <th className="py-3.5">
                                    <div className="min-w-40 text-center">Late Log</div>
                                </th>
                                <th className="py-3.5">
                                    <div className="min-w-40 text-center">Early Leave Log</div>
                                </th>
                                <th className="py-3.5">
                                    <div className="min-w-40 text-center">Overtime Log</div>
                                </th>
                                <th className="py-3.5 text-right pr-4">
                                    <div className="min-w-25 text-right">Export Employee</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No report records available for this month.</p>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 pl-4">
                                            <div className='min-w-50 text-left'>
                                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                    {emp.name}
                                                </p>
                                                <p className="text-slate-400 text-[11px] font-mono">
                                                    {emp.uid} &bull; <span className="text-slate-600 dark:text-slate-300 font-sans">{emp.role}</span>
                                                </p>
                                            </div>
                                        </td>

                                        <td className="py-3.5">
                                            <div className="min-w-40 text-center">
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                                                {emp.present_days}
                                            </span>
                                            <span className="text-slate-400 text-[11px] ml-1">days</span>
                                            </div>
                                        </td>

                                        <td className="py-3.5">
                                            <div className="min-w-40 text-center">
                                            {emp.late_count > 0 ? (
                                                <div>
                                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                        {emp.late_count} time{emp.late_count > 1 ? 's' : ''}
                                                    </span>
                                                    <p className="text-[11px] text-slate-400">
                                                        Total: {emp.late_total_minutes} min
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">0</span>
                                            )}
                                            </div>
                                        </td>

                                        <td className="py-3.5">
                                            <div className="min-w-40 text-center">
                                            {emp.early_leave_count > 0 ? (
                                                <div>
                                                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                                                        {emp.early_leave_count} time{emp.early_leave_count > 1 ? 's' : ''}
                                                    </span>
                                                    <p className="text-[11px] text-slate-400">
                                                        Total: {emp.early_leave_total_minutes} min
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">0</span>
                                            )}
                                            </div>
                                        </td>

                                        <td className="py-3.5">
                                            <div className="min-w-40 text-center">
                                            {emp.overtime_count > 0 ? (
                                                <div>
                                                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                                                        {emp.overtime_count} time{emp.overtime_count > 1 ? 's' : ''}
                                                    </span>
                                                    <p className="text-[11px] text-slate-400">
                                                        Total: {emp.overtime_total_minutes} min
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">0</span>
                                            )}
                                            </div>
                                        </td>

                                        <td className="py-3.5 text-right pr-4">
                                            <button
                                                onClick={() => handleExportEmployee(emp.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                XLSX
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
