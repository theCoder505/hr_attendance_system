import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShieldCheck, AlertOctagon, ArrowRight, Laptop, Clock, CheckCircle2 } from 'lucide-react';
import { showToast } from '@/lib/swal';

interface Props {
    status: 'success' | 'expired' | 'invalid';
    message?: string;
    raw_token?: string;
    employee?: {
        name: string;
        uid: string;
        role: string;
    };
    expires_at?: string;
    brandname: string;
}

export default function VerifyResult({
    status,
    message,
    raw_token,
    employee,
    expires_at,
    brandname,
}: Props) {
    useEffect(() => {
        if (status === 'success' && raw_token) {
            localStorage.setItem('device_token', raw_token);
            showToast('Device successfully authenticated & registered!', 'success');
        }
    }, [status, raw_token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
            <Head title={`Device Verification - ${brandname}`} />

            {/* Glowing background circles */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-3 py-1 rounded-full">
                        {brandname} Secure Device Binding
                    </span>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 text-center">
                    {status === 'success' ? (
                        <>
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-5 shadow-lg shadow-emerald-500/10">
                                <ShieldCheck className="h-10 w-10 animate-bounce" />
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                                Device Verified Successfully!
                            </h1>
                            <p className="text-xs text-slate-400 mb-6">
                                Your device has been securely bound to your employee profile. You can now clock in and out from this browser.
                            </p>

                            {/* Employee Badge Card */}
                            {employee && (
                                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-6 text-left space-y-2">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                                        <span className="text-xs text-slate-400">Employee</span>
                                        <span className="text-xs font-semibold text-white">{employee.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                                        <span className="text-xs text-slate-400">Role</span>
                                        <span className="text-xs font-medium text-indigo-400">{employee.role}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                                        <span className="text-xs text-slate-400">Employee ID</span>
                                        <span className="text-xs font-mono text-slate-300">{employee.uid}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400">Binding Session</span>
                                        <span className="text-xs font-medium text-emerald-400">Valid until {expires_at}</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl mb-6 flex items-center gap-2.5 text-left text-xs text-emerald-300">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                                <span>Security token saved locally. Each daily check-in automatically extends validity by 1 month.</span>
                            </div>

                            <Link
                                href="/attendance"
                                className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 px-5 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <span>Proceed to Attendance Portal</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-5 shadow-lg shadow-rose-500/10">
                                <AlertOctagon className="h-10 w-10" />
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                                Verification Failed
                            </h1>
                            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                                {message || 'This verification link is either invalid, already used, or expired.'}
                            </p>

                            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-left text-xs text-slate-400 mb-6 space-y-2">
                                <p className="font-semibold text-slate-200">How to resolve this:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-400">
                                    <li>Contact your system administrator or HR manager.</li>
                                    <li>Ask them to click <strong className="text-white">"Re-verify / Change device"</strong> on your profile.</li>
                                    <li>Open the newly generated link directly on this device.</li>
                                </ul>
                            </div>

                            <Link
                                href="/attendance"
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                Back to Attendance Portal
                            </Link>
                        </>
                    )}
                </div>

                <div className="mt-6 text-center text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} {brandname}. Secure Device Authentication System.
                </div>
            </div>
        </div>
    );
}
