import AdminLayout from '@/layouts/admin-layout';
import { showConfirm } from '@/lib/swal';
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
    Trash2,
    TrendingUp,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    selectedDate: string;
    currentMonth: number;
    currentYear: number;
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
}

export default function AdminDashboard({
    selectedDate,
    currentMonth,
    currentYear,
    metrics,
    attendances,
    availableEmployees,
    calendarDays,
    settings,
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
            '/administration-control/dashboard',
            { month: newMonth, year: newYear, date: `${newYear}-${String(newMonth).padStart(2, '0')}-01` },
            { preserveState: true },
        );
    };

    // Jump to Date
    const handleDateClick = (dateStr: string) => {
        router.get('/administration-control/dashboard', { date: dateStr, month: currentMonth, year: currentYear }, { preserveState: true });
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
        addForm.post('/administration-control/attendances', {
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

        editForm.put(`/administration-control/attendances/${editingRecord.id}`, {
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
            router.delete(`/administration-control/attendances/${record.id}`);
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
            <Head title="Admin Dashboard - Attendance Management" />
            {/* Calendar & Selected Date Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Top Stat Cards */}
                <div className="lg:col-span-4">
                    <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="text-xs font-medium">Total Staff</span>
                                <Users className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.total_employees}</div>
                            <p className="mt-0.5 text-[11px] text-slate-400">Active profiles</p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="text-xs font-medium">Present</span>
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.present}</div>
                            <p className="mt-0.5 text-[11px] text-slate-400">Logged in today</p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="text-xs font-medium">Late</span>
                                <Clock className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.late}</div>
                            <p className="mt-0.5 text-[11px] text-slate-400">Past check-in time</p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="text-xs font-medium">Early Leave</span>
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metrics.early_leave}</div>
                            <p className="mt-0.5 text-[11px] text-slate-400">Left before time</p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="text-xs font-medium">Overtime</span>
                                <TrendingUp className="h-4 w-4 text-violet-500" />
                            </div>
                            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{metrics.overtime}</div>
                            <p className="mt-0.5 text-[11px] text-slate-400">Extra hours clocked</p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="text-xs font-medium">Absent</span>
                                <Users className="h-4 w-4 text-rose-500" />
                            </div>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{metrics.absent}</div>
                            <p className="mt-0.5 text-[11px] text-slate-400">Not recorded</p>
                        </div>
                    </div>
                </div>

                {/* Interactive Month Calendar (5 cols) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{monthLabel}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleMonthChange(-1)}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                title="Previous Month"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDateClick(todayStr)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => handleMonthChange(1)}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                title="Next Month"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Day of Week Headers */}
                    <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
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
                            <div key={`empty-${i}`} className="h-14 rounded-lg bg-slate-50/50 dark:bg-slate-950/20" />
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
                                    className={`flex h-14 lg:h-20 cursor-pointer flex-col justify-between rounded-xl border p-1.5 text-left transition-all ${
                                        isSelected
                                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-md ring-2 shadow-indigo-600/25 ring-indigo-600/30'
                                            : isToday
                                              ? 'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200'
                                              : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <span className={`text-xs lg:text-lg font-bold ${isSelected ? 'text-white' : ''}`}>{dayNum}</span>
                                        {isToday && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-600'}`} />}
                                    </div>

                                    {/* Mini indicators */}
                                    {data.total_present > 0 && (
                                        <div className="hidden items-center gap-1 lg:flex">
                                            <span
                                                className={`rounded px-1 text-[10px] lg:px-2 text-md lg:py-1 font-semibold ${
                                                    isSelected
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                }`}
                                            >
                                                {data.total_present}p
                                            </span>
                                            {data.total_late > 0 && (
                                                <span
                                                    className={`rounded px-1 text-[10px] lg:px-2 text-md lg:py-1 font-semibold ${
                                                        isSelected
                                                            ? 'bg-amber-400 text-slate-900'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
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

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800">
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

                {/* Selected Date Attendance Records Table (7 cols) */}
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-12 mb-[100px] dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
                        <div>
                            <div className="flex items-center gap-2">
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
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
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
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    <tr className="border-b border-slate-200 font-semibold tracking-wider text-slate-400 uppercase dark:border-slate-800">
                                        <th className="pb-3 pl-1">
                                            <div className="min-w-50 text-left">Employee</div>
                                        </th>
                                        <th className="pb-3">
                                            <div className="min-w-25 text-center">Check In</div>
                                        </th>
                                        <th className="pb-3">
                                            <div className="min-w-25 text-center">Check Out</div>
                                        </th>
                                        <th className="pb-3">
                                            <div className="min-w-25 text-center">Status</div>
                                        </th>
                                        <th className="pb-3">
                                            <div className="min-w-25 text-center">Type</div>
                                        </th>
                                        <th className="pr-1 pb-3 text-right">
                                            <div className="min-w-25 text-right">Actions</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {attendances.map((item) => (
                                        <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="py-3 pl-1">
                                                <div className="min-w-50">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
                                                            <p className="font-semibold text-slate-900 dark:text-white">{item.employee?.name}</p>
                                                            <p className="text-[11px] text-slate-400">
                                                                {item.employee?.role} &bull; {item.employee?.uid}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                                                <div className="min-w-25 text-center">{formatTime(item.check_in_at)}</div>
                                            </td>

                                            <td className="py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                                                <div className="min-w-25 text-center">
                                                    {item.check_out_at ? (
                                                        formatTime(item.check_out_at)
                                                    ) : (
                                                        <span className="rounded bg-amber-50 px-2 py-0.5 font-sans text-[11px] font-medium text-amber-500 dark:bg-amber-950/40">
                                                            In Progress
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3">
                                                <div className="min-w-25 text-center">
                                                    <div className="flex flex-wrap justify-center gap-1">
                                                        {item.late_minutes > 0 && (
                                                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                Late {item.late_minutes}m
                                                            </span>
                                                        )}
                                                        {item.early_leave_minutes > 0 && (
                                                            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                                                                Early Leave {item.early_leave_minutes}m
                                                            </span>
                                                        )}
                                                        {item.overtime_minutes > 0 && (
                                                            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                                                                OT {item.overtime_minutes}m
                                                            </span>
                                                        )}
                                                        {item.late_minutes === 0 && item.early_leave_minutes === 0 && item.overtime_minutes === 0 && (
                                                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                On Time
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3">
                                                <div className="min-w-25 text-center">
                                                    {item.is_manual ? (
                                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            Manual
                                                        </span>
                                                    ) : (
                                                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                            Device
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3 pr-1 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        title="Edit Times"
                                                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRecord(item)}
                                                        title="Delete Attendance"
                                                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
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
                                            {emp.name} — {emp.role} ({emp.uid})
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
