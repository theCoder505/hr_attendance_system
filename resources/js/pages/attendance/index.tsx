import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Clock,
    Calendar,
    Shield,
    ShieldAlert,
    CheckCircle2,
    LogIn,
    LogOut,
    AlertTriangle,
    RefreshCw,
    User,
    TrendingUp,
    Briefcase,
    Building2,
    Wifi,
    ExternalLink,
} from 'lucide-react';
import { showSuccess, showError, showWarning, showToast, showConfirm } from '@/lib/swal';
import Swal from 'sweetalert2';
import ThemeToggle from '@/components/theme-toggle';

interface Props {
    brandname: string;
    logo: string | null;
    officeStartingTime: string;
    officeClosingTime: string;
    clientIp: string;
}

export default function EmployeeAttendancePortal({
    brandname,
    logo,
    officeStartingTime,
    officeClosingTime,
    clientIp,
}: Props) {
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
                    'Accept': 'application/json',
                    'X-Device-Token': token,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'OFFICE_NETWORK_REQUIRED') {
                    setNetworkError(data.message || 'Please come to the office and use your registered device');
                    showError(
                        'Office Network Required',
                        'Please connect to the designated office network to access attendance functions.'
                    );
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
                    'Accept': 'application/json',
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

    // Handle Check In
    const handleCheckIn = async () => {
        const token = localStorage.getItem('device_token');
        if (!token) return;

        const confirmed = await showConfirm(
            'Confirm Clock In',
            `Ready to clock in for today? Current time: ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`,
            'Yes, Clock In Now',
            'info'
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            const res = await fetch('/attendance/check-in', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Device-Token': token,
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
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
            isEarly ? 'warning' : 'info'
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            const res = await fetch('/attendance/check-out', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Device-Token': token,
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
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
        <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white transition-colors">
            <Head title={`Employee Attendance - ${brandname}`} />

            {/* Glowing accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Navigation Bar */}
            <header className="relative z-10 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/25">
                        {logo ? (
                            <img src={`/storage/${logo}`} alt="Logo" className="h-6 w-6 object-contain" />
                        ) : (
                            <Clock className="h-5 w-5" />
                        )}
                    </div>
                    <div>
                        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">{brandname}</span>
                        <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-slate-400 ml-2 font-mono">
                            Attendance Portal
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                    <ThemeToggle variant="dropdown" />

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                        <Wifi className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                        <span>IP: {clientIp}</span>
                    </div>

                    <Link
                        href="/administration-control/login"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        Admin Access
                    </Link>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-10 flex flex-col justify-start">
                {/* Network Error Alert Banner */}
                {networkError && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-3 shadow-sm">
                        <ShieldAlert className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
                        <div className="text-xs">
                            <p className="font-bold text-rose-900 dark:text-rose-200">Office Network Check Failed</p>
                            <p className="mt-0.5">{networkError}</p>
                            <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1">
                                Your detected IP is <span className="font-mono font-semibold">{clientIp}</span>. You must connect to your company office network.
                            </p>
                        </div>
                    </div>
                )}

                {/* Case 1: Unverified Device Screen */}
                {(!hasToken || unverifiedMessage) && !loading && (
                    <div className="my-auto max-w-md mx-auto w-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/60">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 mb-5">
                            <ShieldAlert className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Device Not Verified</h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                            {unverifiedMessage || 'Device not verified, contact admin'}
                        </p>

                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-left text-xs text-slate-600 dark:text-slate-400 mb-6 space-y-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">How to get your device verified:</p>
                            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
                                <li>Contact your company Administrator or HR department.</li>
                                <li>Ask for your personal <strong>Single-Use Verification Link</strong>.</li>
                                <li>Open the link on this browser to register and activate your device.</li>
                            </ol>
                        </div>

                        <button
                            onClick={fetchStatus}
                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry Verification Check
                        </button>
                    </div>
                )}

                {/* Case 2: Loading State */}
                {loading && (
                    <div className="my-auto text-center py-20">
                        <div className="inline-block h-10 w-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Authenticating device & network credentials...</p>
                    </div>
                )}

                {/* Case 3: Verified Employee Portal */}
                {!loading && hasToken && employee && (
                    <div className="space-y-6">
                        {/* Employee Welcome & Clock Header */}
                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-lg dark:shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                            {/* Employee info */}
                            <div className="flex items-center gap-4 text-left w-full md:w-auto">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xl shrink-0 shadow-inner">
                                    {employee.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            {employee.name}
                                        </h1>
                                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Registered Device
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                                        {employee.role} &bull; <span className="text-slate-500 dark:text-slate-400 font-mono">{employee.uid}</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                        Assigned Shift: <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">{employee.check_in_time.substring(0, 5)} - {employee.check_out_time.substring(0, 5)}</span> ({employee.working_hours}h)
                                    </p>
                                </div>
                            </div>

                            {/* Live Clock Display */}
                            <div className="text-center md:text-right bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-6 py-4 w-full md:w-auto shadow-inner">
                                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-wider">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Action Hero Section: Check In / Check Out */}
                        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/60 dark:from-slate-900 dark:to-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 rounded-3xl p-6 sm:p-10 text-center shadow-xl dark:shadow-2xl relative overflow-hidden">
                            <div className="max-w-xl mx-auto space-y-6">
                                {/* State status badge */}
                                {canCheckIn && (
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                                        <LogIn className="h-4 w-4" />
                                        Ready to Clock In for Today
                                    </div>
                                )}

                                {canCheckOut && (
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                                        <LogOut className="h-4 w-4" />
                                        Shift Currently In Progress
                                    </div>
                                )}

                                {!canCheckIn && !canCheckOut && (
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Today's Shift Completed
                                    </div>
                                )}

                                {/* Action Header text */}
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        {canCheckIn && 'Welcome! Start Your Workday'}
                                        {canCheckOut && 'You Are Currently Clocked In'}
                                        {!canCheckIn && !canCheckOut && 'Great Job! All Shift Logs Recorded'}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
                                        {canCheckIn && `Your scheduled start time is ${employee.check_in_time.substring(0, 5)}. Click below to record your check-in timestamp.`}
                                        {canCheckOut && (
                                            <>
                                                Logged in at <span className="font-mono text-slate-900 dark:text-white font-semibold">{formatTime(activeAttendance?.check_in_at)}</span>.
                                                {activeAttendance?.late_minutes > 0 && (
                                                    <span className="text-amber-600 dark:text-amber-400 ml-1.5">({activeAttendance.late_minutes}m late)</span>
                                                )}
                                                {activeAttendance?.date !== currentTime.toISOString().split('T')[0] && (
                                                    <span className="block text-violet-700 dark:text-violet-300 text-xs mt-1 font-semibold">
                                                        Overnight shift active from yesterday ({activeAttendance?.date})
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {!canCheckIn && !canCheckOut && (
                                            <>
                                                In: <span className="font-mono text-slate-900 dark:text-white font-medium">{formatTime(todayRecord?.check_in_at)}</span> &bull;
                                                Out: <span className="font-mono text-slate-900 dark:text-white font-medium ml-1">{formatTime(todayRecord?.check_out_at)}</span>
                                            </>
                                        )}
                                    </p>
                                </div>

                                {/* Primary Glow Buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                                    {canCheckIn && (
                                        <button
                                            onClick={handleCheckIn}
                                            disabled={actionLoading}
                                            className="w-full sm:w-auto min-w-[240px] px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                                        >
                                            {actionLoading ? (
                                                <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                                            className="w-full sm:w-auto min-w-[240px] px-8 py-4 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-amber-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                                        >
                                            {actionLoading ? (
                                                <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <LogOut className="h-5 w-5" />
                                                    <span>Clock Out Now</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {!canCheckIn && !canCheckOut && (
                                        <div className="p-4 bg-white/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl inline-flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
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
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 px-1">
                                    This Month's Attendance Summary
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Days Present</span>
                                        <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                            {monthlyStats.total_days} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">days</span>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Late Minutes</span>
                                        <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                                            {monthlyStats.late_total_minutes} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({monthlyStats.late_count} times)</span>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Early Leaves</span>
                                        <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
                                            {monthlyStats.early_leave_total_minutes} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({monthlyStats.early_leave_count} times)</span>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overtime Logged</span>
                                        <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">
                                            {monthlyStats.overtime_total_minutes} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({monthlyStats.overtime_count} times)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Attendance Log Table */}
                        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                    Your Recent Monthly Log
                                </h3>
                                <button
                                    onClick={fetchStatus}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Refresh Log"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                                            <th className="py-3 pl-4">Date</th>
                                            <th className="py-3">Check In</th>
                                            <th className="py-3">Check Out</th>
                                            <th className="py-3">Late</th>
                                            <th className="py-3">Early Leave</th>
                                            <th className="py-3">Overtime</th>
                                            <th className="py-3 text-right pr-4">Status</th>
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
                                                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3 pl-4 font-medium text-slate-900 dark:text-white">
                                                        {new Date(rec.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                                                    </td>
                                                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                        {formatTime(rec.check_in_at)}
                                                    </td>
                                                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                                                        {rec.check_out_at ? formatTime(rec.check_out_at) : (
                                                            <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">Pending</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        {rec.late_minutes > 0 ? (
                                                            <span className="text-amber-600 dark:text-amber-400 font-semibold">+{rec.late_minutes}m</span>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-500">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        {rec.early_leave_minutes > 0 ? (
                                                            <span className="text-orange-600 dark:text-orange-400 font-semibold">-{rec.early_leave_minutes}m</span>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-500">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3">
                                                        {rec.overtime_minutes > 0 ? (
                                                            <span className="text-violet-600 dark:text-violet-400 font-semibold">+{rec.overtime_minutes}m</span>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-500">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 text-right pr-4">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
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
            <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800/80 px-4 py-5 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} {brandname}. Connected from {clientIp}. Shared Hosting & Zero VPS Setup.
            </footer>
        </div>
    );
}
