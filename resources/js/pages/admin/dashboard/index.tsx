import AdminLayout from '@/layouts/admin-layout';
import StoragePieChart, { StorageDetails } from '@/components/storage-pie-chart';
import { showConfirm } from '@/lib/swal';
import { formatMinutes } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit2,
    Plus,
    Sparkles,
    Store,
    Trash2,
    TrendingUp,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface OutletItem {
    id: number;
    uid: string;
    name: string;
    wifi_ip: string;
    employees_count?: number;
}

interface Props {
    selectedDate: string;
    currentMonth: number;
    currentYear: number;
    activeOutletId?: string | number;
    outlets?: OutletItem[];
    metrics: {
        total_employees: number;
        present: number;
        late: number;
        early_leave: number;
        overtime: number;
        absent: number;
    };
    attendances: any[];
    availableEmployees: any[];
    calendarDays: Record<string, any>;
    settings: any;
    storageDetails?: StorageDetails;
}

export default function AdminDashboard({
    selectedDate,
    currentMonth,
    currentYear,
    activeOutletId = 'all',
    outlets = [],
    metrics,
    attendances,
    availableEmployees,
    calendarDays,
    settings,
    storageDetails,
}: Props) {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    // Form for manually adding attendance record
    const addForm = useForm({
        employee_id: '',
        date: selectedDate,
        check_in_time: settings?.office_starting_time || '09:00',
        check_out_time: settings?.office_closing_time || '17:00',
    });

    // Form for editing attendance record
    const editForm = useForm({
        check_in_time: '',
        check_out_time: '',
    });

    // Change Month
    const handleMonthChange = (offset: number) => {
        let newMonth = currentMonth + offset;
        let newYear = currentYear;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        router.get(
            '/store/dashboard',
            {
                month: newMonth,
                year: newYear,
                date: `${newYear}-${String(newMonth).padStart(2, '0')}-01`,
                outlet_id: activeOutletId,
            },
            { preserveState: true },
        );
    };

    // Jump to Date
    const handleDateClick = (dateStr: string) => {
        router.get(
            '/store/dashboard',
            { date: dateStr, month: currentMonth, year: currentYear, outlet_id: activeOutletId },
            { preserveState: true }
        );
        addForm.setData('date', dateStr);
    };

    // Open Edit Modal
    const openEditModal = (record: any) => {
        setEditingRecord(record);
        const inTime = record.check_in_at ? record.check_in_at.substring(11, 16) : '';
        const outTime = record.check_out_at ? record.check_out_at.substring(11, 16) : '';
        editForm.setData({
            check_in_time: inTime,
            check_out_time: outTime,
        });
        setEditModalOpen(true);
    };

    // Submit Add Record
    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post('/store/attendances', {
            onSuccess: () => {
                setAddModalOpen(false);
                addForm.reset();
            },
        });
    };

    // Submit Edit Record
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;

        editForm.put(`/store/attendances/${editingRecord.id}`, {
            onSuccess: () => {
                setEditModalOpen(false);
                setEditingRecord(null);
            },
        });
    };

    // Delete Record
    const handleDeleteRecord = async (record: any) => {
        const empName = record.employee?.name || 'this employee';
        const confirmed = await showConfirm(
            'Delete Attendance Record?',
            `Are you sure you want to remove attendance for ${empName} on ${record.date}?`,
            'Yes, delete',
        );

        if (confirmed) {
            router.delete(`/store/attendances/${record.id}`);
        }
    };

    // Format display helpers
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthLabel = `${monthNames[currentMonth - 1]} ${currentYear}`;

    // Calendar grid calculations
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const formatTime = (dtStr: string | null) => {
        if (!dtStr) return '—';
        try {
            const d = new Date(dtStr);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return dtStr;
        }
    };

    return (
        <AdminLayout title="Attendance Dashboard & Calendar">
            <Head title="Store Dashboard - Attendance Management" />

            {/* Store Hub Header Banner */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl mb-6">
                {/* Decorative background glows */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-2.5 backdrop-blur-md shadow-sm">
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>Store Attendance & Workspace Hub</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                            {settings?.website_title || 'Store Attendance Dashboard'}
                        </h1>
                        <p className="text-xs sm:text-sm text-purple-100/90 mt-1 max-w-2xl">
                            Real-time attendance logs, employee shifts, monthly calendar overview, and storage quota monitoring.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={() => {
                                addForm.setData('date', selectedDate);
                                setAddModalOpen(true);
                            }}
                            disabled={availableEmployees.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 hover:text-purple-800 text-xs font-bold shadow-lg shadow-purple-950/20 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4 text-purple-700 stroke-[3]" />
                            <span>Add Attendance</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Outlet Tabs Navigation */}
            <div className="mb-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() =>
                        router.get(
                            '/store/dashboard',
                            { date: selectedDate, month: currentMonth, year: currentYear, outlet_id: 'all' },
                            { preserveState: true }
                        )
                    }
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeOutletId === 'all' || !activeOutletId
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                        : 'border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 shadow-sm'
                        }`}
                >
                    <Store className="h-4 w-4" />
                    <span>All Outlets</span>
                </button>

                {outlets.map((outlet) => {
                    const isActive = String(activeOutletId) === String(outlet.id);
                    return (
                        <button
                            key={outlet.id}
                            onClick={() =>
                                router.get(
                                    '/store/dashboard',
                                    { date: selectedDate, month: currentMonth, year: currentYear, outlet_id: outlet.id },
                                    { preserveState: true }
                                )
                            }
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${isActive
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                                : 'border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 shadow-sm'
                                }`}
                        >
                            <Store className="h-4 w-4" />
                            <span>{outlet.name}</span>
                            <span className="font-mono text-[10px] opacity-80">({outlet.wifi_ip})</span>
                        </button>
                    );
                })}
            </div>

            {/* Store Data Storage & Limit Pie Chart */}
            {storageDetails && (
                <StoragePieChart storageDetails={storageDetails} className="mb-6" />
            )}

            {/* Calendar & Selected Date Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Top Stat Cards */}
                <div className="lg:col-span-4">
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2">
                        {/* Total Staff */}
                        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-purple-100/30 p-4 shadow-sm hover:shadow-md transition-all dark:border-indigo-800/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Total Staff</span>
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25 flex items-center justify-center">
                                    <Users className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{metrics.total_employees}</div>
                            <p className="mt-0.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Active profiles</p>
                        </div>

                        {/* Present */}
                        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-teal-100/30 p-4 shadow-sm hover:shadow-md transition-all dark:border-emerald-800/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Present</span>
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/25 flex items-center justify-center">
                                    <UserCheck className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{metrics.present}</div>
                            <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Logged in today</p>
                        </div>

                        {/* Late */}
                        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white to-yellow-100/30 p-4 shadow-sm hover:shadow-md transition-all dark:border-amber-800/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Late</span>
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white shadow-sm shadow-amber-500/25 flex items-center justify-center">
                                    <Clock className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{metrics.late}</div>
                            <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">Past check-in</p>
                        </div>

                        {/* Early Leave */}
                        <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/80 via-white to-rose-100/30 p-4 shadow-sm hover:shadow-md transition-all dark:border-orange-800/60 dark:from-orange-950/30 dark:via-slate-900 dark:to-slate-900">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">Early Leave</span>
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white shadow-sm shadow-orange-500/25 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{metrics.early_leave}</div>
                            <p className="mt-0.5 text-[11px] text-orange-600 dark:text-orange-400 font-medium">Left early</p>
                        </div>

                        {/* Overtime */}
                        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-100/30 p-4 shadow-sm hover:shadow-md transition-all dark:border-violet-800/60 dark:from-violet-950/30 dark:via-slate-900 dark:to-slate-900">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Overtime</span>
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-violet-500/25 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{metrics.overtime}</div>
                            <p className="mt-0.5 text-[11px] text-violet-600 dark:text-violet-400 font-medium">Extra hours</p>
                        </div>

                        {/* Absent */}
                        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/80 via-white to-red-100/30 p-4 shadow-sm hover:shadow-md transition-all dark:border-rose-800/60 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Absent</span>
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-sm shadow-rose-500/25 flex items-center justify-center">
                                    <Users className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{metrics.absent}</div>
                            <p className="mt-0.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">Not recorded</p>
                        </div>
                    </div>
                </div>

                {/* Interactive Month Calendar (8 cols) */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm lg:col-span-8 dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 flex items-center justify-center">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{monthLabel}</h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleMonthChange(-1)}
                                className="rounded-xl border border-slate-200/90 p-2 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                title="Previous Month"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDateClick(todayStr)}
                                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => handleMonthChange(1)}
                                className="rounded-xl border border-slate-200/90 p-2 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                title="Next Month"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Day of Week Headers */}
                    <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                        <span>Su</span>
                        <span>Mo</span>
                        <span>Tu</span>
                        <span>We</span>
                        <span>Th</span>
                        <span>Fr</span>
                        <span>Sa</span>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                        {/* Empty leading days */}
                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-14 lg:h-18 rounded-xl bg-slate-50/60 dark:bg-slate-950/30" />
                        ))}

                        {/* Calendar Day Tiles */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const isSelected = selectedDate === dStr;
                            const isToday = todayStr === dStr;
                            const data = calendarDays[dStr] || { total_present: 0, total_late: 0 };

                            return (
                                <button
                                    key={dStr}
                                    onClick={() => handleDateClick(dStr)}
                                    className={`flex h-14 lg:h-18 cursor-pointer flex-col justify-between rounded-xl border p-1.5 text-left transition-all ${isSelected
                                        ? 'border-indigo-600 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-purple-400'
                                        : isToday
                                            ? 'border-indigo-400 bg-indigo-50/90 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200 font-bold'
                                            : 'border-slate-200/80 bg-slate-50/70 text-slate-700 hover:bg-indigo-50/40 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <span className={`text-xs lg:text-base font-extrabold ${isSelected ? 'text-white' : ''}`}>{dayNum}</span>
                                        {isToday && <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-600 animate-pulse'}`} />}
                                    </div>

                                    {/* Mini indicators */}
                                    {data.total_present > 0 && (
                                        <div className="hidden items-center gap-1 lg:flex">
                                            <span
                                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                                    }`}
                                            >
                                                {data.total_present}p
                                            </span>
                                            {data.total_late > 0 && (
                                                <span
                                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isSelected
                                                        ? 'bg-amber-400 text-slate-900'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                                        }`}
                                                >
                                                    {data.total_late}L
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Present (p)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Late (L)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" /> Selected
                        </span>
                    </div>
                </div>

                {/* Selected Date Attendance Records Table (12 cols) */}
                <div className="flex flex-col rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm lg:col-span-12 mb-[100px] dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Attendance for{' '}
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </h3>
                                {selectedDate === todayStr && (
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                        Today
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">
                                Showing {attendances.length} employee record{attendances.length === 1 ? '' : 's'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    addForm.setData('date', selectedDate);
                                    setAddModalOpen(true);
                                }}
                                disabled={availableEmployees.length === 0}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                                Add Manual Attendance
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto">
                        {attendances.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                                <CalendarIcon className="mb-2 h-10 w-10 text-slate-300 dark:text-slate-700" />
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    No attendance entries recorded for this date.
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Use "Add Manual Attendance" or employees can clock in using their device.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 font-bold tracking-wider text-slate-500 uppercase text-[10px]">
                                        <th className="py-3 pl-3">
                                            <div className="min-w-50 text-left">Employee</div>
                                        </th>
                                        <th className="py-3">
                                            <div className="min-w-25 text-center">Check In</div>
                                        </th>
                                        <th className="py-3">
                                            <div className="min-w-25 text-center">Check Out</div>
                                        </th>
                                        <th className="py-3">
                                            <div className="min-w-25 text-center">Status</div>
                                        </th>
                                        <th className="py-3">
                                            <div className="min-w-25 text-center">Type</div>
                                        </th>
                                        <th className="pr-3 py-3 text-right">
                                            <div className="min-w-25 text-right">Actions</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {attendances.map((item) => (
                                        <tr key={item.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                            <td className="py-3 pl-3">
                                                <div className="min-w-50">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                                                            {item.employee?.image ? (
                                                                <img
                                                                    src={`/storage/${item.employee.image}`}
                                                                    alt={item.employee?.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                item.employee?.name?.substring(0, 2).toUpperCase() || 'EM'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{item.employee?.name}</p>
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                                                <span>{item.employee?.role} &bull; {item.employee?.uid}</span>
                                                                {(item.outlet || item.employee?.outlet) && (
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                                                                        <Store className="h-2.5 w-2.5" />
                                                                        {(item.outlet || item.employee?.outlet)?.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                <div className="min-w-25 text-center">{formatTime(item.check_in_at)}</div>
                                            </td>

                                            <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                <div className="min-w-25 text-center">
                                                    {item.check_out_at ? (
                                                        formatTime(item.check_out_at)
                                                    ) : (
                                                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-sans text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                                            In Progress
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3">
                                                <div className="min-w-25 text-center">
                                                    <div className="flex flex-wrap justify-center gap-1">
                                                        {item.late_minutes > 0 && (
                                                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                                                Late {formatMinutes(item.late_minutes)}
                                                            </span>
                                                        )}
                                                        {item.early_leave_minutes > 0 && (
                                                            <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-700">
                                                                Early {formatMinutes(item.early_leave_minutes)}
                                                            </span>
                                                        )}
                                                        {item.overtime_minutes > 0 && (
                                                            <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-300 dark:border-violet-700">
                                                                OT {formatMinutes(item.overtime_minutes)}
                                                            </span>
                                                        )}
                                                        {item.late_minutes === 0 && item.early_leave_minutes === 0 && item.overtime_minutes === 0 && (
                                                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                                                On Time
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3">
                                                <div className="min-w-25 text-center">
                                                    {item.is_manual ? (
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                            Manual
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                                                            Device
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3 pr-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        title="Edit Times"
                                                        className="rounded-lg p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRecord(item)}
                                                        title="Delete Attendance"
                                                        className="rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Record Modal */}
            {addModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Add Manual Attendance</h4>
                                <p className="text-xs text-slate-400">Date: {selectedDate}</p>
                            </div>
                            <button
                                onClick={() => setAddModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Select Employee</label>
                                <select
                                    value={addForm.data.employee_id}
                                    onChange={(e) => addForm.setData('employee_id', e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                >
                                    <option value="">-- Choose Employee --</option>
                                    {availableEmployees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} — {emp.role} ({emp.uid}){emp.outlet ? ` [${emp.outlet.name}]` : ''}
                                        </option>
                                    ))}
                                </select>
                                {addForm.errors.employee_id && <p className="mt-1 text-xs text-rose-500">{addForm.errors.employee_id}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Check In Time</label>
                                    <input
                                        type="time"
                                        value={addForm.data.check_in_time}
                                        onChange={(e) => addForm.setData('check_in_time', e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    {addForm.errors.check_in_time && <p className="mt-1 text-xs text-rose-500">{addForm.errors.check_in_time}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Check Out Time</label>
                                    <input
                                        type="time"
                                        value={addForm.data.check_out_time}
                                        onChange={(e) => addForm.setData('check_out_time', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    {addForm.errors.check_out_time && <p className="mt-1 text-xs text-rose-500">{addForm.errors.check_out_time}</p>}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addForm.processing}
                                    className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
                                >
                                    {addForm.processing ? 'Saving...' : 'Save Attendance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Record Modal */}
            {editModalOpen && editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Edit Attendance Record</h4>
                                <p className="text-xs text-slate-400">
                                    {editingRecord.employee?.name} ({editingRecord.date})
                                </p>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Check In Time</label>
                                    <input
                                        type="time"
                                        value={editForm.data.check_in_time}
                                        onChange={(e) => editForm.setData('check_in_time', e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    {editForm.errors.check_in_time && <p className="mt-1 text-xs text-rose-500">{editForm.errors.check_in_time}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Check Out Time</label>
                                    <input
                                        type="time"
                                        value={editForm.data.check_out_time}
                                        onChange={(e) => editForm.setData('check_out_time', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    {editForm.errors.check_out_time && <p className="mt-1 text-xs text-rose-500">{editForm.errors.check_out_time}</p>}
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-400">
                                Note: Changing times will automatically recalculate Late, Early Leave, and Overtime values.
                            </p>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
                                >
                                    {editForm.processing ? 'Updating...' : 'Update Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
