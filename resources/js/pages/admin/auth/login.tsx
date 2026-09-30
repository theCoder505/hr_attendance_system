import { useEffect } from 'react';
import { useForm, usePage, Head } from '@inertiajs/react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { showError, showWarning } from '@/lib/swal';

interface Props {
    brandname: string;
    logo?: string | null;
}

export default function AdminLogin({ brandname, logo }: Props) {
    const { flash } = usePage<any>().props;

    const { data, setData, post, processing, errors } = useForm({
        email: 'admin@attendance.com',
        password: '',
    });

    useEffect(() => {
        if (flash?.error) {
            showError(flash.error);
        }
        if (flash?.warning) {
            showWarning(flash.warning);
        }
    }, [flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/administration-control/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
            <Head title={`Admin Sign In - ${brandname}`} />

            {/* Background glowing orbs */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-500/30 mb-4 ring-8 ring-indigo-500/10">
                        {logo ? (
                            <img src={`/storage/${logo}`} alt="Logo" className="h-10 w-10 object-contain" />
                        ) : (
                            <Shield className="h-8 w-8" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
                        {brandname}
                    </h1>
                    <p className="text-sm text-slate-400">
                        Administration Control Portal
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-white">Sign In</h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Enter your administrative credentials to request a 2FA OTP code.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                Administrator Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    placeholder="admin@attendance.com"
                                    className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-rose-400 text-xs mt-1.5">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full bg-slate-950/60 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all outline-none"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-rose-400 text-xs mt-1.5">{errors.password}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Continue to OTP Verification</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-slate-800 flex items-center gap-2.5 text-slate-400 text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Protected with Email OTP verification & inactivity timeout</span>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} {brandname}. Designed for Shared Hosting & Production Reliability.
                </div>
            </div>
        </div>
    );
}
