import { useState, useEffect } from 'react';
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
    Wifi,
    Plus,
    Trash2,
} from 'lucide-react';
import { showSuccess, showError, showToast } from '@/lib/swal';
import { useAppearance } from '@/hooks/use-appearance';
import ImageUploadPreview from '@/components/image-upload-preview';

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

    const parseInitialWifi = (str: string | undefined): string[] => {
        if (!str) return ['127.0.0.1'];
        const list = str
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        return list.length > 0 ? list.slice(0, 5) : ['127.0.0.1'];
    };

    const [wifiAddresses, setWifiAddresses] = useState<string[]>(() =>
        parseInitialWifi(settings.office_ipv4_addr)
    );

    useEffect(() => {
        setWifiAddresses(parseInitialWifi(settings.office_ipv4_addr));
    }, [settings.office_ipv4_addr]);

    const syncWifiToForm = (list: string[]) => {
        setWifiAddresses(list);
        generalForm.setData('office_ipv4_addr', list.map((s) => s.trim()).filter(Boolean).join(', '));
    };

    const handleWifiChange = (index: number, val: string) => {
        const updated = [...wifiAddresses];
        updated[index] = val;
        setWifiAddresses(updated);
        generalForm.setData('office_ipv4_addr', updated.map((s) => s.trim()).filter(Boolean).join(', '));
    };

    const handleAddWifi = () => {
        if (wifiAddresses.length >= 5) {
            showToast('Maximum 5 WiFi addresses allowed', 'warning');
            return;
        }
        const updated = [...wifiAddresses, ''];
        setWifiAddresses(updated);
    };

    const handleRemoveWifi = (index: number) => {
        if (wifiAddresses.length <= 1) {
            const updated = [''];
            syncWifiToForm(updated);
            return;
        }
        const updated = wifiAddresses.filter((_, i) => i !== index);
        syncWifiToForm(updated);
    };

    const handleSetCurrentIp = (index: number) => {
        if (!clientIp) return;
        const updated = [...wifiAddresses];
        updated[index] = clientIp;
        syncWifiToForm(updated);
    };

    const handleAddCurrentIp = () => {
        if (!clientIp) return;
        if (wifiAddresses.includes(clientIp)) {
            showToast(`Current IP (${clientIp}) is already in the list`, 'info');
            return;
        }
        const emptyIndex = wifiAddresses.findIndex((ip) => !ip.trim());
        if (emptyIndex !== -1) {
            handleSetCurrentIp(emptyIndex);
            return;
        }
        if (wifiAddresses.length >= 5) {
            showToast('Maximum 5 WiFi addresses reached. Remove one to add current IP.', 'warning');
            return;
        }
        const updated = [...wifiAddresses, clientIp];
        syncWifiToForm(updated);
    };

    const handleGeneralSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = wifiAddresses.map((ip) => ip.trim()).filter(Boolean);
        if (cleaned.length === 0) {
            showError(
                'Missing WiFi / IP Address',
                'Please configure at least one authorized WiFi or network IP address (or * to allow any network).'
            );
            return;
        }

        generalForm.transform((data) => ({
            ...data,
            office_ipv4_addr: cleaned.join(', '),
        }));

        generalForm.post('/administration-control/settings/general', {
            onSuccess: () => {
                generalForm.setData((prev) => ({ ...prev, logo: null, favicon: null }));
                showToast('General settings updated successfully!', 'success');
            },
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
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'general'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Settings className="h-4 w-4" />
                    Attendance Rules & Brand
                </button>

                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'security'
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

                            <ImageUploadPreview
                                id="setting-logo"
                                label="Brand Logo"
                                currentImageUrl={settings.logo ? `/storage/${settings.logo}` : null}
                                selectedFile={generalForm.data.logo}
                                onFileChange={(file) => generalForm.setData('logo', file)}
                                accept="image/*,.jpeg,.jpg,.png,.webp,.svg"
                                aspectRatio="auto"
                                helperText="PNG, JPG, SVG or WEBP (Max 2MB)"
                                error={generalForm.errors.logo}
                            />

                            <ImageUploadPreview
                                id="setting-favicon"
                                label="Favicon Icon"
                                currentImageUrl={settings.favicon ? `/storage/${settings.favicon}` : null}
                                selectedFile={generalForm.data.favicon}
                                onFileChange={(file) => generalForm.setData('favicon', file)}
                                accept="image/*,.ico,.png,.svg"
                                aspectRatio="square"
                                helperText="ICO, PNG or SVG (Max 1MB)"
                                error={generalForm.errors.favicon}
                            />
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

                            {/* Authorized Office WiFi / Network IP Addresses */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                            <Wifi className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Authorized Office WiFi / Network Addresses *
                                                </label>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${wifiAddresses.length >= 5
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                                                        }`}
                                                >
                                                    {wifiAddresses.length} / 5
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                Employees can only submit attendance when connected to one of these authorized WiFi addresses.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action buttons on header */}
                                    <div className="flex items-center gap-2">
                                        {clientIp && !wifiAddresses.includes(clientIp) && (
                                            <button
                                                type="button"
                                                onClick={handleAddCurrentIp}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                                                title={`Add your detected network IP (${clientIp})`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Add My IP ({clientIp})
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleAddWifi}
                                            disabled={wifiAddresses.length >= 5}
                                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm transition-all cursor-pointer ${wifiAddresses.length >= 5
                                                    ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-500/20'
                                                }`}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add WiFi {wifiAddresses.length >= 5 ? '(Max 5)' : ''}
                                        </button>
                                    </div>
                                </div>

                                {/* Dynamic list of WiFi inputs */}
                                <div className="space-y-2">
                                    {wifiAddresses.map((ip, index) => {
                                        const isCurrent = clientIp && ip.trim() === clientIp;
                                        return (
                                            <div
                                                key={index}
                                                className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950/70"
                                            >
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                                    #{index + 1}
                                                </div>

                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={ip}
                                                        onChange={(e) => handleWifiChange(index, e.target.value)}
                                                        placeholder={
                                                            index === 0
                                                                ? 'Primary WiFi IP (e.g. 192.168.1.1 or 127.0.0.1)'
                                                                : `Office WiFi #${index + 1} IP (e.g. 192.168.2.1)`
                                                        }
                                                        className="w-full bg-transparent px-2 py-1 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-600"
                                                    />
                                                </div>

                                                {/* Badge if matches current IP */}
                                                {isCurrent && (
                                                    <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Current IP
                                                    </span>
                                                )}

                                                {/* Use current IP button for this specific row */}
                                                {clientIp && !isCurrent && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetCurrentIp(index)}
                                                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                                                        title={`Set to current IP (${clientIp})`}
                                                    >
                                                        Use My IP
                                                    </button>
                                                )}

                                                {/* Delete button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveWifi(index)}
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors cursor-pointer ${wifiAddresses.length <= 1
                                                            ? 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-slate-800'
                                                            : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/50 dark:hover:text-rose-400'
                                                        }`}
                                                    title={wifiAddresses.length <= 1 ? 'Clear address' : 'Remove this WiFi address'}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer info and quick hints */}
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-600 dark:text-slate-300">Tip:</span>
                                        <span>Use * to disable network restriction and allow attendance from any IP.</span>
                                    </div>
                                    <div>
                                        {wifiAddresses.length < 5 ? (
                                            <button
                                                type="button"
                                                onClick={handleAddWifi}
                                                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Add another WiFi address ({5 - wifiAddresses.length} slots remaining)
                                            </button>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                Maximum limit reached (5 of 5 WiFi addresses)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {generalForm.errors.office_ipv4_addr && (
                                    <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                                        {generalForm.errors.office_ipv4_addr}
                                    </p>
                                )}
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
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${appearance === 'light'
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
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${appearance === 'dark'
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
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${appearance === 'system'
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
