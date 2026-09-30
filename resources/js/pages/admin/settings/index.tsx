import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Settings,
    Shield,
    Lock,
    KeyRound,
    Clock,
    Globe,
    AlertTriangle,
    Upload,
    CheckCircle2,
    Send,
    Sun,
    Moon,
    Monitor,
} from 'lucide-react';
import { showSuccess, showError, showToast } from '@/lib/swal';
import { useAppearance } from '@/hooks/use-appearance';

interface Props {
    settings: {
        brandname: string;
        logo: string | null;
        favicon: string | null;
        office_starting_time: string;
        office_closing_time: string;
        office_ipv4_addr: string;
        missing_checkout_early_leave_minutes: number;
        admin_login_2fa_enabled: boolean;
    };
    admin: {
        name: string;
        email: string;
        session_time: number;
        two_factor_enabled: boolean;
    };
    clientIp: string;
}

export default function SettingsIndex({ settings, admin, clientIp }: Props) {
    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
    const [otpRequested, setOtpRequested] = useState(false);
    const { appearance, updateAppearance } = useAppearance();

    // Form 1: General Settings
    const generalForm = useForm({
        brandname: settings.brandname || '',
        office_starting_time: settings.office_starting_time || '09:00',
        office_closing_time: settings.office_closing_time || '17:00',
        office_ipv4_addr: settings.office_ipv4_addr || '127.0.0.1',
        missing_checkout_early_leave_minutes: settings.missing_checkout_early_leave_minutes || 60,
        admin_login_2fa_enabled: settings.admin_login_2fa_enabled ?? true,
        logo: null as File | null,
        favicon: null as File | null,
    });

    // Form 2: Profile Settings
    const profileForm = useForm({
        name: admin.name || '',
        session_time: admin.session_time || 30,
        two_factor_enabled: admin.two_factor_enabled ?? true,
    });

    // Form 3: Credentials with OTP
    const credentialsForm = useForm({
        otp: '',
        email: admin.email || '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleGeneralSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        generalForm.post('/administration-control/settings/general', {
            onSuccess: () => showToast('General settings updated successfully!', 'success'),
        });
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.post('/administration-control/settings/profile', {
            onSuccess: () => showToast('Profile details updated!', 'success'),
        });
    };

    const handleRequestOtp = () => {
        router.post('/administration-control/settings/credentials/otp', {}, {
            onSuccess: () => {
                setOtpRequested(true);
                showSuccess('A 6-digit OTP code has been dispatched to ' + admin.email);
            },
        });
    };

    const handleCredentialsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        credentialsForm.post('/administration-control/settings/credentials', {
            onSuccess: () => {
                setOtpRequested(false);
                credentialsForm.reset('otp', 'current_password', 'password', 'password_confirmation');
                showToast('Security credentials updated successfully!', 'success');
            },
        });
    };

    return (
        <AdminLayout title="System Settings & Security">
            <Head title="Settings - Attendance Management" />

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === 'general'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Settings className="h-4 w-4" />
                    Attendance Rules & Brand
                </button>

                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === 'security'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Shield className="h-4 w-4" />
                    Admin Profile & 2FA Security
                </button>
            </div>

            {/* TAB 1: General & Rules */}
            {activeTab === 'general' && (
                <form onSubmit={handleGeneralSubmit} className="space-y-6 max-w-4xl">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                            Branding & Identity
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">
                            Customize the brand name, system logos, and header appearance.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    System Brand Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={generalForm.data.brandname}
                                    onChange={(e) => generalForm.setData('brandname', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                {generalForm.errors.brandname && (
                                    <p className="text-rose-500 text-xs mt-1">{generalForm.errors.brandname}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Brand Logo
                                </label>
                                {settings.logo && (
                                    <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg inline-block border border-slate-200 dark:border-slate-700">
                                        <img src={`/storage/${settings.logo}`} alt="Logo" className="h-8 object-contain" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => generalForm.setData('logo', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Favicon Icon
                                </label>
                                {settings.favicon && (
                                    <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg inline-block border border-slate-200 dark:border-slate-700">
                                        <img src={`/storage/${settings.favicon}`} alt="Favicon" className="h-6 w-6 object-contain" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*,.ico"
                                    onChange={(e) => generalForm.setData('favicon', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                            Office Schedule & Network Security Rules
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">
                            Set working shift thresholds, office IP whitelist, and missing checkout penalty rules.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Office Starting Time (Default Check-In) *
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={generalForm.data.office_starting_time}
                                    onChange={(e) => generalForm.setData('office_starting_time', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Office Closing Time (Default Check-Out) *
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={generalForm.data.office_closing_time}
                                    onChange={(e) => generalForm.setData('office_closing_time', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Office IPv4 Address *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => generalForm.setData('office_ipv4_addr', clientIp)}
                                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                        Set to my current IP ({clientIp})
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="127.0.0.1 or comma-separated IPs"
                                    value={generalForm.data.office_ipv4_addr}
                                    onChange={(e) => generalForm.setData('office_ipv4_addr', e.target.value)}
                                    className="w-full font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Employees must connect from this office IP to clock in/out. (Set to * to disable restriction).
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Missing Check-Out Early Leave Penalty (Minutes) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="720"
                                    value={generalForm.data.missing_checkout_early_leave_minutes}
                                    onChange={(e) => generalForm.setData('missing_checkout_early_leave_minutes', Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Penalty minutes assigned when an attendance record is auto-closed without a check-out.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={generalForm.processing}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                            {generalForm.processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 2: Admin Profile & Security */}
            {activeTab === 'security' && (
                <div className="space-y-6 max-w-4xl">
                    {/* Basic Profile */}
                    <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                            Administrator Profile & Inactivity Timeout
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">
                            Update your display name and session inactivity logout timer.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Admin Display Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Session Timeout (Inactivity Minutes) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="5"
                                    max="1440"
                                    value={profileForm.data.session_time}
                                    onChange={(e) => profileForm.setData('session_time', Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Default is 30 minutes. Auto-logs out admin after no activity.
                                </span>
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                Login Two-Factor Authentication (2FA)
                                            </h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                When enabled, admin login requires email OTP verification. When disabled, you sign in directly with password.
                                            </p>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={profileForm.data.two_factor_enabled}
                                            onChange={(e) => profileForm.setData('two_factor_enabled', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Appearance Theme Selector */}
                            <div className="md:col-span-2 pt-1">
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                            {appearance === 'dark' ? <Moon className="h-5 w-5" /> : appearance === 'light' ? <Sun className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                Interface Appearance (Theme)
                                            </h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Choose your visual appearance: Light, Dark, or System Sync.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl gap-1 shrink-0 self-start sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => updateAppearance('light')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                appearance === 'light'
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Sun className="h-3.5 w-3.5 text-amber-500" />
                                            Light
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateAppearance('dark')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                appearance === 'dark'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Moon className="h-3.5 w-3.5 text-indigo-300" />
                                            Dark
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateAppearance('system')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                appearance === 'system'
                                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <Monitor className="h-3.5 w-3.5 text-slate-400" />
                                            System
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-5">
                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
                            >
                                {profileForm.processing ? 'Saving...' : 'Update Profile & 2FA Setting'}
                            </button>
                        </div>
                    </form>

                    {/* Sensitive Credentials: Email & Password (Requires Email OTP!) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-1">
                            <KeyRound className="h-5 w-5 text-amber-500" />
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                Change Email / Password (2FA OTP Protected)
                            </h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-5">
                            Modifying sensitive credentials requires email OTP verification sent to your current address (
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{admin.email}</span>).
                        </p>

                        {!otpRequested ? (
                            <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                        Step 1: Request Security Verification OTP
                                    </h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">
                                        Click below to send a single-use 6-digit confirmation code to your email.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRequestOtp}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 cursor-pointer shrink-0"
                                >
                                    <Send className="h-4 w-4" />
                                    Send Verification OTP
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                        OTP sent to {admin.email}! Enter code below.
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                                    >
                                        Resend Code
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                                            Enter 6-Digit Email OTP *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            placeholder="123456"
                                            value={credentialsForm.data.otp}
                                            onChange={(e) => credentialsForm.setData('otp', e.target.value.replace(/\D/g, ''))}
                                            className="w-full max-w-xs font-mono font-bold text-center tracking-widest bg-slate-50 dark:bg-slate-950 border border-amber-300 dark:border-amber-800 rounded-xl px-3.5 py-2.5 text-base text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20"
                                        />
                                        {credentialsForm.errors.otp && (
                                            <p className="text-rose-500 text-xs mt-1">{credentialsForm.errors.otp}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            New Email Address (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            value={credentialsForm.data.email}
                                            onChange={(e) => credentialsForm.setData('email', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                        {credentialsForm.errors.email && (
                                            <p className="text-rose-500 text-xs mt-1">{credentialsForm.errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Current Password (If changing password)
                                        </label>
                                        <input
                                            type="password"
                                            value={credentialsForm.data.current_password}
                                            onChange={(e) => credentialsForm.setData('current_password', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                        {credentialsForm.errors.current_password && (
                                            <p className="text-rose-500 text-xs mt-1">{credentialsForm.errors.current_password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            New Password (Min 8 chars, Optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={credentialsForm.data.password}
                                            onChange={(e) => credentialsForm.setData('password', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                        {credentialsForm.errors.password && (
                                            <p className="text-rose-500 text-xs mt-1">{credentialsForm.errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={credentialsForm.data.password_confirmation}
                                            onChange={(e) => credentialsForm.setData('password_confirmation', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setOtpRequested(false)}
                                        className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={credentialsForm.processing}
                                        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 cursor-pointer"
                                    >
                                        {credentialsForm.processing ? 'Verifying OTP...' : 'Verify OTP & Apply Changes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
