import { useState, useEffect } from 'react';
import { useForm, usePage, Head, router, Link } from '@inertiajs/react';
import { KeyRound, ArrowRight, RotateCw, ArrowLeft, ShieldCheck } from 'lucide-react';
import { showSuccess, showError, showToast } from '@/lib/swal';
import ThemeToggle from '@/components/theme-toggle';

interface Props {
    masked_email: string;
}

export default function AdminOtp({ masked_email }: Props) {
    const { flash } = usePage<any>().props;
    const [resendCooldown, setResendCooldown] = useState(60);

    const { data, setData, post, processing, errors } = useForm({
        otp: '',
    });

    useEffect(() => {
        if (flash?.success) {
            showSuccess(flash.success);
        }
        if (flash?.error) {
            showError(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/administration-control/otp');
    };

    const handleResend = () => {
        if (resendCooldown > 0) return;
        router.post('/administration-control/otp/resend', {}, {
            onSuccess: () => {
                setResendCooldown(60);
                showToast('New OTP dispatched to your email!', 'success');
            },
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
            <Head title="Two-Factor Authentication - OTP" />

            {/* Top Right Theme Toggle */}
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle variant="dropdown" />
            </div>

            {/* Glowing orbs */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-xl shadow-amber-500/20 mb-4 ring-8 ring-amber-500/10">
                        <KeyRound className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1.5">
                        Two-Factor Authentication
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Verification code sent to <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">{masked_email}</span>
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Enter 6-Digit One-Time Password (OTP)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={data.otp}
                                    onChange={(e) => setData('otp', e.target.value.replace(/\D/g, ''))}
                                    required
                                    placeholder="123456"
                                    autoFocus
                                    className="w-full text-center tracking-[0.5em] font-mono font-bold text-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl py-3 px-4 text-amber-600 dark:text-amber-300 placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none"
                                />
                            </div>
                            {errors.otp && (
                                <p className="text-rose-500 text-xs text-center mt-2">{errors.otp}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || data.otp.length < 6}
                            className="w-full bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Verify & Enter Dashboard</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend actions */}
                    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <Link
                            href="/administration-control/login"
                            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Login
                        </Link>

                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendCooldown > 0}
                            className={`flex items-center gap-1.5 transition-colors ${
                                resendCooldown > 0
                                    ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer font-medium'
                            }`}
                        >
                            <RotateCw className={`h-3.5 w-3.5 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform duration-500'}`} />
                            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend OTP'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Secure Admin Guard with Auto-Expiring Credentials</span>
                </div>
            </div>
        </div>
    );
}
