import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import {
    Settings,
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
    CreditCard,
    Building2,
    Calendar,
    Smartphone,
    AlertCircle,
    Palette,
    Upload,
} from 'lucide-react';
import { showSuccess, showError, showToast } from '@/lib/swal';
import ImageUploadPreview from '@/components/image-upload-preview';

interface Props {
    superAdmin: {
        id: number;
        name: string;
        email: string;
        session_time: number;
        created_at: string;
    };
    branding?: {
        brandname: string;
        logo: string | null;
        favicon: string | null;
    };
    billingSettings: {
        bkash_number: string | null;
        bkash_type: string;
        bkash_enabled: boolean;
        nagad_number: string | null;
        nagad_type: string;
        nagad_enabled: boolean;
        bank_name: string | null;
        bank_account_name: string | null;
        bank_account_number: string | null;
        bank_branch: string | null;
        bank_routing: string | null;
        bank_enabled: boolean;
        payment_due_day: number;
        default_monthly_fee: number;
    };
}

export default function SuperAdminProfile({ superAdmin, branding, billingSettings }: Props) {
    const [otpRequested, setOtpRequested] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form 1: Platform Branding & Identity form (Exclusive to Super Admin)
    const brandingForm = useForm({
        brandname: branding?.brandname || 'AttendEase Pro',
        logo: null as File | null,
        favicon: null as File | null,
    });

    const handleBrandingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        brandingForm.post('/super-admin/settings/branding', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => showToast('Platform branding & identity updated successfully!', 'success'),
            onError: (err: any) => showError('Validation Error', Object.values(err)[0] as string),
        });
    };

    // Form 2: Profile form (Name & Session Timeout)
    const profileForm = useForm({
        name: superAdmin.name,
        session_time: superAdmin.session_time || 30,
    });

    // Form 3: Payment Receiving Accounts & Due Date form
    const billingForm = useForm({
        bkash_number: billingSettings?.bkash_number || '',
        bkash_type: billingSettings?.bkash_type || 'Personal',
        bkash_enabled: billingSettings?.bkash_enabled ?? true,
        nagad_number: billingSettings?.nagad_number || '',
        nagad_type: billingSettings?.nagad_type || 'Personal',
        nagad_enabled: billingSettings?.nagad_enabled ?? true,
        bank_name: billingSettings?.bank_name || '',
        bank_account_name: billingSettings?.bank_account_name || '',
        bank_account_number: billingSettings?.bank_account_number || '',
        bank_branch: billingSettings?.bank_branch || '',
        bank_routing: billingSettings?.bank_routing || '',
        bank_enabled: billingSettings?.bank_enabled ?? true,
        payment_due_day: billingSettings?.payment_due_day || 7,
        default_monthly_fee: billingSettings?.default_monthly_fee || 500,
    });

    const handleBillingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        billingForm.post('/super-admin/settings/billing', {
            onSuccess: () => showToast('Payment receiving details & due date updated!', 'success'),
            onError: (err: any) => showError('Validation Error', Object.values(err)[0] as string),
        });
    };

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
        profileForm.post('/super-admin/settings', {
            onSuccess: () => showToast('Profile details saved successfully!', 'success'),
            onError: (err: any) => showError('Update Failed', Object.values(err)[0] as string),
        });
    };

    const handleRequestOtp = () => {
        setOtpLoading(true);
        router.post(
            '/super-admin/settings/credentials/otp',
            {},
            {
                onSuccess: () => {
                    setOtpRequested(true);
                    setOtpLoading(false);
                    showToast('OTP Code sent to ' + superAdmin.email, 'success');
                },
                onError: (err: any) => {
                    setOtpLoading(false);
                    showError('Failed to Request OTP', Object.values(err)[0] as string);
                },
            }
        );
    };

    const handleCredentialsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!credsForm.data.otp || credsForm.data.otp.length !== 6) {
            showError('Invalid OTP', 'Please provide the 6-digit verification code.');
            return;
        }

        credsForm.post('/super-admin/settings/credentials', {
            onSuccess: () => {
                showSuccess('Success', 'Security credentials updated successfully!');
                credsForm.reset('current_password', 'password', 'password_confirmation', 'otp');
                setOtpRequested(false);
            },
            onError: (err: any) => {
                showError('Update Failed', Object.values(err)[0] as string);
            },
        });
    };

    return (
        <SuperAdminLayout title="Settings">
            <Head title="Settings - Super Admin" />

            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Settings
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage global platform branding & identity, root administrator profile, payment receiving gateways, and security credentials.
                </p>
            </div>

            {/* 1. Global Platform Branding & Identity (Super Admin Only) */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Palette className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Branding & Identity</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Configure system-wide brand name, application logo, and browser favicon across all surface & store pages.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleBrandingSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            System Brand Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={brandingForm.data.brandname}
                            onChange={(e) => brandingForm.setData('brandname', e.target.value)}
                            placeholder="e.g. AttendEase Pro"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {brandingForm.errors.brandname && (
                            <p className="text-rose-500 text-xs mt-1">{brandingForm.errors.brandname}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ImageUploadPreview
                            id="super-admin-brand-logo"
                            label="Brand Logo"
                            currentImageUrl={branding?.logo ? `/storage/${branding.logo}` : null}
                            selectedFile={brandingForm.data.logo}
                            onFileChange={(file) => brandingForm.setData('logo', file)}
                            accept="image/*,.jpeg,.jpg,.png,.webp,.svg"
                            aspectRatio="auto"
                            helperText="PNG, JPG, SVG or WEBP (Max 2MB). Used in headers and public portals."
                            error={brandingForm.errors.logo}
                        />

                        <ImageUploadPreview
                            id="super-admin-brand-favicon"
                            label="Browser Favicon"
                            currentImageUrl={branding?.favicon ? `/storage/${branding.favicon}` : null}
                            selectedFile={brandingForm.data.favicon}
                            onFileChange={(file) => brandingForm.setData('favicon', file)}
                            accept="image/*,.ico,.png,.svg"
                            aspectRatio="square"
                            helperText="ICO, PNG or SVG (Max 1MB). Displayed on browser tabs."
                            error={brandingForm.errors.favicon}
                        />
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={brandingForm.processing}
                            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            <span>{brandingForm.processing ? 'Saving Branding...' : 'Save Branding & Identity'}</span>
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 2. General Profile Info */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Admin Identity Profile</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Display name & session security</p>
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

                {/* 3. Sensitive Credentials Change via OTP */}
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
                                    <KeyRound className="h-3.5 w-3.5" />
                                    <span>Enter 6-Digit OTP Code sent to {superAdmin.email} *</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    placeholder="e.g. 123456"
                                    value={credsForm.data.otp}
                                    onChange={(e) => credsForm.setData('otp', e.target.value.replace(/\D/g, ''))}
                                    className="w-full text-center font-mono tracking-widest text-lg font-bold py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500"
                                />
                                {credsForm.errors.otp && (
                                    <p className="text-[11px] text-rose-600 font-semibold">{credsForm.errors.otp}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    New Email Address (Optional)
                                </label>
                                <input
                                    type="email"
                                    value={credsForm.data.email}
                                    onChange={(e) => credsForm.setData('email', e.target.value)}
                                    placeholder={superAdmin.email}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Current Password (Required for password change)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={credsForm.data.current_password}
                                        onChange={(e) => credsForm.setData('current_password', e.target.value)}
                                        placeholder="Enter your current password"
                                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {credsForm.errors.current_password && (
                                    <p className="text-[11px] text-rose-600 font-semibold">{credsForm.errors.current_password}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={credsForm.data.password}
                                            onChange={(e) => credsForm.setData('password', e.target.value)}
                                            placeholder="Min. 8 characters"
                                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {credsForm.errors.password && (
                                        <p className="text-[11px] text-rose-600 font-semibold">{credsForm.errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={credsForm.data.password_confirmation}
                                            onChange={(e) => credsForm.setData('password_confirmation', e.target.value)}
                                            placeholder="Repeat new password"
                                            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setOtpRequested(false)}
                                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={credsForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {credsForm.processing ? 'Verifying...' : 'Authorize & Update Credentials'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* 4. Payment Receiving Accounts & Due Date */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Platform Payment Accounts & Monthly Due Date</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Configure receiving accounts (bKash, Nagad, Bank) that store owners see when paying their monthly subscription invoices.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleBillingSubmit} className="space-y-6">
                    {/* Due Date & Default Monthly Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Monthly Payment Due Deadline Day (1 - 31) *</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                required
                                value={billingForm.data.payment_due_day}
                                onChange={(e) => billingForm.setData('payment_due_day', parseInt(e.target.value) || 7)}
                                className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-[11px] text-purple-700/80 dark:text-purple-400">
                                Store owners must complete payment on or before this day of every month (Default: 7th). If not verified by this date, attendance service is suspended.
                            </p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5" />
                                <span>Default Base Monthly Fee (BDT) *</span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                required
                                value={billingForm.data.default_monthly_fee}
                                onChange={(e) => billingForm.setData('default_monthly_fee', parseFloat(e.target.value) || 0)}
                                className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-[11px] text-purple-700/80 dark:text-purple-400">
                                Fallback fee billed automatically on the 1st of each month if a custom store fee is not specified.
                            </p>
                        </div>
                    </div>

                    {/* bKash & Nagad Accounts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* bKash */}
                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">bKash Receiving Account</span>
                                </div>
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={billingForm.data.bkash_enabled}
                                        onChange={(e) => billingForm.setData('bkash_enabled', e.target.checked)}
                                        className="h-3.5 w-3.5 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
                                    />
                                    <span className={`text-[11px] font-semibold ${billingForm.data.bkash_enabled ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400'}`}>
                                        {billingForm.data.bkash_enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    bKash Number
                                </label>
                                <input
                                    type="text"
                                    value={billingForm.data.bkash_number}
                                    onChange={(e) => billingForm.setData('bkash_number', e.target.value)}
                                    placeholder="e.g. 01711223344"
                                    className="w-full px-3 py-2 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Account Type
                                </label>
                                <select
                                    value={billingForm.data.bkash_type}
                                    onChange={(e) => billingForm.setData('bkash_type', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Personal">Personal</option>
                                    <option value="Merchant">Merchant</option>
                                    <option value="Agent">Agent</option>
                                </select>
                            </div>
                        </div>

                        {/* Nagad */}
                        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">Nagad Receiving Account</span>
                                </div>
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={billingForm.data.nagad_enabled}
                                        onChange={(e) => billingForm.setData('nagad_enabled', e.target.checked)}
                                        className="h-3.5 w-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                                    />
                                    <span className={`text-[11px] font-semibold ${billingForm.data.nagad_enabled ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                                        {billingForm.data.nagad_enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Nagad Number
                                </label>
                                <input
                                    type="text"
                                    value={billingForm.data.nagad_number}
                                    onChange={(e) => billingForm.setData('nagad_number', e.target.value)}
                                    placeholder="e.g. 01811223344"
                                    className="w-full px-3 py-2 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Account Type
                                </label>
                                <select
                                    value={billingForm.data.nagad_type}
                                    onChange={(e) => billingForm.setData('nagad_type', e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Personal">Personal</option>
                                    <option value="Merchant">Merchant</option>
                                    <option value="Agent">Agent</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="font-bold text-xs text-slate-900 dark:text-white">Bank Account Details</span>
                            </div>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={billingForm.data.bank_enabled}
                                    onChange={(e) => billingForm.setData('bank_enabled', e.target.checked)}
                                    className="h-3.5 w-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                                <span className={`text-[11px] font-semibold ${billingForm.data.bank_enabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                    {billingForm.data.bank_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={billingForm.data.bank_name}
                                    onChange={(e) => billingForm.setData('bank_name', e.target.value)}
                                    placeholder="e.g. City Bank PLC"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    value={billingForm.data.bank_account_name}
                                    onChange={(e) => billingForm.setData('bank_account_name', e.target.value)}
                                    placeholder="e.g. AttendEase Ltd"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={billingForm.data.bank_account_number}
                                    onChange={(e) => billingForm.setData('bank_account_number', e.target.value)}
                                    placeholder="e.g. 1102233445501"
                                    className="w-full px-3 py-2 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Branch Name
                                </label>
                                <input
                                    type="text"
                                    value={billingForm.data.bank_branch}
                                    onChange={(e) => billingForm.setData('bank_branch', e.target.value)}
                                    placeholder="e.g. Gulshan Branch, Dhaka"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Routing Number
                                </label>
                                <input
                                    type="text"
                                    value={billingForm.data.bank_routing}
                                    onChange={(e) => billingForm.setData('bank_routing', e.target.value)}
                                    placeholder="e.g. 225272635"
                                    className="w-full px-3 py-2 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                        <button
                            type="submit"
                            disabled={billingForm.processing}
                            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {billingForm.processing ? 'Saving...' : 'Save Payment & Billing Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </SuperAdminLayout>
    );
}
