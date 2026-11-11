import { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { showError, showWarning } from '@/lib/swal';
import ThemeToggle from '@/components/theme-toggle';

interface Props {
    brandname: string;
    logo: string | null;
    flash?: {
        error?: string;
        warning?: string;
    };
}

export default function SuperAdminLogin({ brandname, flash }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
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
        post('/super-admin/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden transition-colors">
            <Head title={`Super Admin Portal - ${brandname}`} />

            {/* Top Right Theme Toggle & Links */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
                <ThemeToggle variant="dropdown" />
                <Link
                    href="/store/login"
                    className="text-xs text-indigo-300 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md"
                >
                    Store Login
                </Link>
            </div>

            {/* Background glowing orbs */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                {/* Login Card */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
                    {/* Header */}
                    <div className="text-center mb-7">
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 mb-4 shadow-lg shadow-purple-600/20">
                            <Shield className="h-7 w-7" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            System Control Panel
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Sign in to manage multiple stores, outlet quotas, and storage analytics.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-purple-400" />
                                Super Admin Email
                            </label>
                            <input
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Admin email"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                            {errors.email && (
                                <p className="text-xs text-rose-400">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-purple-400" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="********"
                                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-700 bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-rose-400">{errors.password}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <span>{processing ? 'Authenticating...' : 'Sign In as Super Admin'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-500">
                        <Link href="/attendance" className="hover:text-purple-400 transition-colors">
                            &larr; Return to Attendance Portal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

