import ThemeToggle from '@/components/theme-toggle';
import { showConfirm, showError, showSuccess } from '@/lib/swal';
import { Head } from '@inertiajs/react';
import { CheckCircle2, Clock, LogIn, LogOut, RefreshCw, ShieldAlert, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    brandname: string;
    logo: string | null;
    officeStartingTime: string;
    officeClosingTime: string;
    clientIp: string;
}

export default function EmployeeAttendancePortal({ brandname, logo, clientIp }: Props) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [hasToken, setHasToken] = useState<boolean | null>(null);
    const [unverifiedMessage, setUnverifiedMessage] = useState<string | null>(null);
    const [networkError, setNetworkError] = useState<string | null>(null);

    const [employee, setEmployee] = useState<any>(null);
    const [activeAttendance, setActiveAttendance] = useState<any>(null);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [canCheckIn, setCanCheckIn] = useState(false);
    const [canCheckOut, setCanCheckOut] = useState(false);
    const [monthlyStats, setMonthlyStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Live clock ticker
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Check device token and fetch initial status
    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        const token = localStorage.getItem('device_token');
        if (!token) {
            setHasToken(false);
            setUnverifiedMessage('Device not verified, contact admin');
            setLoading(false);
            return;
        }

        setHasToken(true);
        setLoading(true);
        setNetworkError(null);

        try {
            const res = await fetch('/attendance/status', {
                headers: {
                    Accept: 'application/json',
                    'X-Device-Token': token,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'OFFICE_NETWORK_REQUIRED') {
                    setNetworkError(data.message || 'Please come to the office and use your registered device');
                    showError('Office Network Required', 'Please connect to the designated office network to access attendance functions.');
                } else {
                    setUnverifiedMessage(data.message || 'Device not verified, contact admin');
                }
                setLoading(false);
                return;
            }

            if (data.success) {
                setEmployee(data.employee);
                setActiveAttendance(data.attendance);
                setTodayRecord(data.todayRecord);
                setCanCheckIn(data.canCheckIn);
                setCanCheckOut(data.canCheckOut);
                setMonthlyStats(data.monthlyStats);
                setUnverifiedMessage(null);
                fetchHistory(token);
            }
        } catch (err) {
            console.error('Attendance status error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (token: string) => {
        try {
            const res = await fetch('/attendance/history', {
                headers: {
                    Accept: 'application/json',
                    'X-Device-Token': token,
                },
            });
            const data = await res.json();
            if (data.success) {
                setHistory(data.records);
            }
        } catch (e) {
            console.error('History fetch error:', e);
        }
    };

    const getCsrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        if (meta?.content) return meta.content;

        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    // Handle Check In
    const handleCheckIn = async () => {
        const token = localStorage.getItem('device_token');
        if (!token) return;

        const confirmed = await showConfirm(
            'Confirm Clock In',
            `Ready to clock in for today? Current time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`,
            'Yes, Clock In Now',
            'info',
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            const csrfToken = getCsrfToken();
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Device-Token': token,
            };
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
                headers['X-XSRF-TOKEN'] = csrfToken;
            }

            const res = await fetch('/attendance/check-in', {
                method: 'POST',
                headers,
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showSuccess('Checked In Successfully!', data.message);
                fetchStatus();
            } else {
                showError(data.message || 'Check-in failed');
            }
        } catch (err: any) {
            showError('Network error during check in. Please verify your office connection.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Check Out
    const handleCheckOut = async () => {
        const token = localStorage.getItem('device_token');
        if (!token) return;

        const isEarly = employee?.check_out_time && currentTime.toTimeString().substring(0, 5) < employee.check_out_time;

        const confirmed = await showConfirm(
            'Confirm Clock Out',
            isEarly
                ? `Note: Current time is before your scheduled shift end (${employee.check_out_time.substring(0, 5)}). Early leave minutes will be calculated.`
                : 'Are you ready to clock out and complete your shift for today?',
            'Yes, Clock Out Now',
            isEarly ? 'warning' : 'info',
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            const csrfToken = getCsrfToken();
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Device-Token': token,
            };
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
                headers['X-XSRF-TOKEN'] = csrfToken;
            }

            const res = await fetch('/attendance/check-out', {
                method: 'POST',
                headers,
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showSuccess('Checked Out Successfully!', data.message);
                fetchStatus();
            } else {
                showError(data.message || 'Check-out failed');
            }
        } catch (err: any) {
            showError('Network error during check out. Please verify your office connection.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '—';
        try {
            const d = new Date(timeStr);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return timeStr;
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 antialiased transition-colors selection:bg-indigo-500 selection:text-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
            <Head title={`Employee Attendance - ${brandname}`} />

            {/* Glowing accents */}
            <div className="pointer-events-none absolute top-0 left-1/2 h-80 w-3/4 -translate-x-1/2 rounded-full bg-indigo-600/5 blur-3xl dark:bg-indigo-600/10" />

            {/* Top Navigation Bar */}
            <header className="relative z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3.5 backdrop-blur-md sm:px-8 dark:border-slate-800/80 dark:bg-slate-950/60">
                <div className="flex items-center gap-3">
                    <div className="w-40">
                        {logo ? <img src={`/storage/${logo}`} alt="Logo" className="h-auto w-full object-contain" /> : <Clock className="h-5 w-5" />}
                    </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                    <ThemeToggle variant="dropdown" />

                    <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600 sm:flex dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                        <Wifi className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span>IP: {clientIp}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-start px-4 py-8 sm:py-10">
                {/* Network Error Alert Banner */}
                {networkError && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                        <ShieldAlert className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
                        <div className="text-xs">
                            <p className="font-bold text-rose-900 dark:text-rose-200">Office Network Check Failed</p>
                            <p className="mt-0.5">{networkError}</p>
                            <p className="mt-1 text-[11px] text-rose-700 dark:text-rose-400">
                                Your detected IP is <span className="font-mono font-semibold">{clientIp}</span>. You must connect to your company
                                office network.
                            </p>
                        </div>
                    </div>
                )}

                {/* Case 1: Unverified Device Screen */}
                {(!hasToken || unverifiedMessage) && !loading && (
                    <div className="mx-auto my-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-6 text-center shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:p-8 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-black/60">
                        <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/10 text-amber-500 dark:text-amber-400">
                            <ShieldAlert className="h-10 w-10" />
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Device Not Verified</h2>
                        <p className="mb-6 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {unverifiedMessage || 'Device not verified, contact admin'}
                        </p>

                        <div className="mb-6 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">How to get your device verified:</p>
                            <ol className="list-inside list-decimal space-y-1.5 text-slate-600 dark:text-slate-400">
                                <li>Contact your company Administrator or HR department.</li>
                                <li>
                                    Ask for your personal <strong>Single-Use Verification Link</strong>.
                                </li>
                                <li>Open the link on this browser to register and activate your device.</li>
                            </ol>
                        </div>

                        <button
                            onClick={fetchStatus}
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry Verification Check
                        </button>
                    </div>
                )}

                {/* Case 2: Loading State */}
                {loading && (
                    <div className="my-auto py-20 text-center">
                        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Authenticating device & network credentials...</p>
                    </div>
                )}

                {/* Case 3: Verified Employee Portal */}
                {!loading && hasToken && employee && (
                    <div className="space-y-6">
                        {/* Employee Welcome & Clock Header */}
                        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg backdrop-blur-xl sm:p-7 md:flex-row dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-xl">
                            {/* Employee info */}
                            <div className="flex w-full items-center gap-4 text-left md:w-auto">
                                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50 text-xl font-bold text-indigo-600 shadow-inner dark:border-indigo-500/30 dark:bg-indigo-600/20 dark:text-indigo-400">
                                    {employee.image ? (
                                        <img
                                            src={employee.image.startsWith('http') || employee.image.startsWith('/') ? employee.image : `/storage/${employee.image}`}
                                            alt={employee.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.nextElementSibling;
                                                if (fallback) {
                                                    (fallback as HTMLElement).classList.remove('hidden');
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <span className={employee.image ? 'hidden' : ''}>
                                        {employee.name.substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                                            {employee.name}
                                        </h1>
                                        <span className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 sm:inline-flex dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-400">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Registered Device
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                        {employee.role} &bull; <span className="font-mono text-slate-500 dark:text-slate-400">{employee.uid}</span>
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        Assigned Shift:{' '}
                                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                            {employee.check_in_time.substring(0, 5)} - {employee.check_out_time.substring(0, 5)}
                                        </span>{' '}
                                        ({employee.working_hours}h)
                                    </p>
                                </div>
                            </div>

                            {/* Live Clock Display */}
                            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-center shadow-inner md:w-auto md:text-right dark:border-slate-800/80 dark:bg-slate-950/60">
                                <div className="font-mono text-3xl font-extrabold tracking-wider text-slate-900 sm:text-4xl dark:text-white">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                </div>
                                <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Action Hero Section: Check In / Check Out */}
                        <div className="items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg backdrop-blur-xl sm:p-7 md:flex-row dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-xl">
                            <div className="mx-auto max-w-xl space-y-6">
                                {/* State status badge */}
                                {canCheckIn && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                                        <LogIn className="h-4 w-4" />
                                        Ready to Clock In for Today
                                    </div>
                                )}

                                {canCheckOut && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                                        <LogOut className="h-4 w-4" />
                                        Shift Currently In Progress
                                    </div>
                                )}

                                {!canCheckIn && !canCheckOut && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Today's Shift Completed
                                    </div>
                                )}

                                {/* Action Header text */}
                                <div>
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                                        {canCheckIn && 'Welcome! Start Your Workday'}
                                        {canCheckOut && 'You Are Currently Clocked In'}
                                        {!canCheckIn && !canCheckOut && 'Great Job! All Shift Logs Recorded'}
                                    </h2>
                                    <p className="mt-2 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                                        {canCheckIn &&
                                            `Your scheduled start time is ${employee.check_in_time.substring(0, 5)}. Click below to record your check-in timestamp.`}
                                        {canCheckOut && (
                                            <>
                                                Logged in at{' '}
                                                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                                                    {formatTime(activeAttendance?.check_in_at)}
                                                </span>
                                                .
                                                {activeAttendance?.late_minutes > 0 && (
                                                    <span className="ml-1.5 text-amber-600 dark:text-amber-400">
                                                        ({activeAttendance.late_minutes}m late)
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {!canCheckIn && !canCheckOut && (
                                            <>
                                                In:{' '}
                                                <span className="font-mono font-medium text-slate-900 dark:text-white">
                                                    {formatTime(todayRecord?.check_in_at)}
                                                </span>{' '}
                                                &bull; Out:{' '}
                                                <span className="ml-1 font-mono font-medium text-slate-900 dark:text-white">
                                                    {formatTime(todayRecord?.check_out_at)}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>

                                {/* Primary Glow Buttons */}
                                <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
                                    {canCheckIn && (
                                        <button
                                            onClick={handleCheckIn}
                                            disabled={actionLoading}
                                            className="flex w-full min-w-[240px] cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-50 sm:w-auto"
                                        >
                                            {actionLoading ? (
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <>
                                                    <LogIn className="h-5 w-5" />
                                                    <span>Clock In Now</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {canCheckOut && (
                                        <button
                                            onClick={handleCheckOut}
                                            disabled={actionLoading}
                                            className="flex w-full min-w-[240px] cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-amber-600/30 transition-all hover:scale-105 hover:from-amber-500 hover:to-indigo-500 active:scale-95 disabled:opacity-50 sm:w-auto"
                                        >
                                            {actionLoading ? (
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <>
                                                    <LogOut className="h-5 w-5" />
                                                    <span>Clock Out Now</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {!canCheckIn && !canCheckOut && (
                                        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                                            <span>Thank you! Your full attendance record for today is locked and synchronized.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Monthly Summary Statistics */}
                        {monthlyStats && (
                            <div>
                                <h3 className="mb-3 px-1 text-sm font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                    This Month's Attendance Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Days Present</span>
                                        <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                                            {monthlyStats.total_days}{' '}
                                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">days</span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Late Minutes</span>
                                        <div className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                                            {monthlyStats.late_total_minutes}{' '}
                                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                                ({monthlyStats.late_count} times)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Early Leaves</span>
                                        <div className="mt-1 text-2xl font-extrabold text-orange-600 dark:text-orange-400">
                                            {monthlyStats.early_leave_total_minutes}{' '}
                                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                                ({monthlyStats.early_leave_count} times)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overtime Logged</span>
                                        <div className="mt-1 text-2xl font-extrabold text-violet-600 dark:text-violet-400">
                                            {monthlyStats.overtime_total_minutes}{' '}
                                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                                ({monthlyStats.overtime_count} times)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Attendance Log Table */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                            <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-5 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Recent Monthly Log</h3>
                                <button
                                    onClick={fetchStatus}
                                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                    title="Refresh Log"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 font-semibold tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                                            <th className="py-3 pl-4">Date</th>
                                            <th className="py-3">
                                                <div className="min-w-30 text-center">Check In</div>
                                            </th>
                                            <th className="py-3">
                                                <div className="min-w-30 text-center">Check Out</div>
                                            </th>
                                            <th className="py-3">
                                                <div className="min-w-30 text-center">Late</div>
                                            </th>
                                            <th className="py-3">
                                                <div className="min-w-30 text-center">Early Leave</div>
                                            </th>
                                            <th className="py-3">
                                                <div className="min-w-30 text-center">Overtime</div>
                                            </th>
                                            <th className="py-3 pr-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                                        {history.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-10 text-center text-slate-500 dark:text-slate-400">
                                                    No prior records found for this month.
                                                </td>
                                            </tr>
                                        ) : (
                                            history.map((rec) => (
                                                <tr key={rec.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="py-3 pl-4 font-medium text-slate-900 dark:text-white">
                                                        <div className="min-w-30 text-left">
                                                            {new Date(rec.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                        <div className="min-w-30 text-center">{formatTime(rec.check_in_at)}</div>
                                                    </td>
                                                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                        <div className="min-w-30 text-center">
                                                            {rec.check_out_at ? (
                                                                formatTime(rec.check_out_at)
                                                            ) : (
                                                                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="min-w-30 text-center">
                                                            {rec.late_minutes > 0 ? (
                                                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                                    +{rec.late_minutes}m
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-slate-500">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="min-w-30 text-center">
                                                            {rec.early_leave_minutes > 0 ? (
                                                                <span className="font-semibold text-orange-600 dark:text-orange-400">
                                                                    -{rec.early_leave_minutes}m
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-slate-500">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="min-w-30 text-center">
                                                            {rec.overtime_minutes > 0 ? (
                                                                <span className="font-semibold text-violet-600 dark:text-violet-400">
                                                                    +{rec.overtime_minutes}m
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-slate-500">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/60 dark:text-emerald-400">
                                                            Recorded
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200 px-4 py-5 text-center text-xs text-slate-500 dark:border-slate-800/80">
                &copy; {new Date().getFullYear()} {brandname}.
            </footer>
        </div>
    );
}
