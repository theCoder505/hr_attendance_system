import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import {
    ShieldCheck,
    Mail,
    Lock,
    KeyRound,
    CheckCircle2,
    Clock,
    User,
    ShieldAlert,
    Sparkles,
    Eye,
    EyeOff,
} from 'lucide-react';
import { showSuccess, showError, showToast } from '@/lib/swal';

interface Props {
    superAdmin: {
        id: number;
        name: string;
        email: string;
        session_time: number;
        created_at: string;
    };
}

export default function SuperAdminProfile({ superAdmin }: Props) {
    const [otpRequested, setOtpRequested] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile form (Name & Session Timeout)
    const profileForm = useForm({
        name: superAdmin.name,
        session_time: superAdmin.session_time || 30,
    });

    // Sensitive credentials form (Email / Password + OTP)
    const credsForm = useForm({
        email: superAdmin.email,
        current_password: '',
        password: '',
        password_confirmation: '',
        otp: '',
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.post('/super-admin/profile', {
            onSuccess: () => showToast('Profile details updated!', 'success'),
            onError: (err: any) => showError('Validation Error', Object.values(err)[0] as string),
        });
    };

    const handleRequestOtp = () => {
        setOtpLoading(true);
        router.post(
            '/super-admin/profile/credentials/otp',
            {},
            {
                onSuccess: () => {
                    setOtpRequested(true);
                    setOtpLoading(false);
                    showSuccess('OTP Dispatched', `A 6-digit security code has been sent to ${superAdmin.email}. Enter it below to authorize credential updates.`);
                },
                onError: () => {
                    setOtpLoading(false);
                    showError('Error', 'Failed to dispatch verification OTP.');
                },
            }
        );
    };

    const handleCredentialsSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!credsForm.data.otp || credsForm.data.otp.length !== 6) {
            showError('OTP Required', 'Please enter the 6-digit OTP code sent to your email.');
            return;
        }

        credsForm.post('/super-admin/profile/credentials', {
            onSuccess: () => {
                setOtpRequested(false);
                credsForm.reset('otp', 'current_password', 'password', 'password_confirmation');
                showSuccess('Credentials Updated', 'Super Admin email and/or password updated successfully.');
            },
            onError: (err: any) => {
                showError('Update Failed', Object.values(err)[0] as string);
            },
        });
    };

    return (
        <SuperAdminLayout title="Super Admin Profile & Security">
            <Head title="Profile & Security - Super Admin" />

            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Super Admin Security & Profile
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage root identity, session timeout policies, and authorize email/password changes via OTP verification.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. General Profile Info */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Admin Details</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Basic administrative preferences</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Administrator Name
                            </label>
                            <input
                                type="text"
                                required
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Session Inactivity Timeout (Minutes)
                            </label>
                            <input
                                type="number"
                                min={5}
                                max={720}
                                required
                                value={profileForm.data.session_time}
                                onChange={(e) => profileForm.setData('session_time', parseInt(e.target.value) || 30)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-[11px] text-slate-400">
                                Automatically logs out super admin if idle for this amount of time.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {profileForm.processing ? 'Saving...' : 'Save Profile Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 2. Sensitive Credentials Change via OTP */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Credentials & OTP Verification</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Change email or password with two-factor authorization</p>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
                        <span>
                            To change your Super Admin email address or login password, click <strong>"Request Security OTP"</strong>. A verification code will be dispatched to your current email (<strong>{superAdmin.email}</strong>).
                        </span>
                    </div>

                    {!otpRequested ? (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleRequestOtp}
                                disabled={otpLoading}
                                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Mail className="h-4 w-4" />
                                <span>{otpLoading ? 'Dispatching OTP...' : 'Request Security OTP to Change Credentials'}</span>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleCredentialsSubmit} className="space-y-4 pt-2">
                            {/* OTP Code Input */}
                            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-1.5">
                                <label className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                                    <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                                    Enter 6-Digit Email OTP Code <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    value={credsForm.data.otp}
                                    onChange={(e) => credsForm.setData('otp', e.target.value.replace(/\D/g, ''))}
                                    placeholder="e.g. 123456"
                                    className="w-full px-3.5 py-2 font-mono text-center tracking-widest font-bold text-sm rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                                {credsForm.errors.otp && (
                                    <p className="text-xs text-rose-500">{credsForm.errors.otp}</p>
                                )}
                            </div>

                            {/* New Email */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    New Super Admin Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={credsForm.data.email}
                                    onChange={(e) => credsForm.setData('email', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                                {credsForm.errors.email && (
                                    <p className="text-xs text-rose-500">{credsForm.errors.email}</p>
                                )}
                            </div>

                            {/* Current Password */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Current Password (Required if changing password)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={credsForm.data.current_password}
                                        onChange={(e) => credsForm.setData('current_password', e.target.value)}
                                        placeholder="Enter current password"
                                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        tabIndex={-1}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {credsForm.errors.current_password && (
                                    <p className="text-xs text-rose-500">{credsForm.errors.current_password}</p>
                                )}
                            </div>

                            {/* New Password & Confirmation */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={credsForm.data.password}
                                            onChange={(e) => credsForm.setData('password', e.target.value)}
                                            placeholder="Min 8 characters"
                                            className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            tabIndex={-1}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                            title={showNewPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {credsForm.errors.password && (
                                        <p className="text-xs text-rose-500">{credsForm.errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={credsForm.data.password_confirmation}
                                            onChange={(e) => credsForm.setData('password_confirmation', e.target.value)}
                                            placeholder="Re-type new password"
                                            className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setOtpRequested(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={credsForm.processing || credsForm.data.otp.length !== 6}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {credsForm.processing ? 'Verifying...' : 'Verify OTP & Apply Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </SuperAdminLayout>
    );
}

