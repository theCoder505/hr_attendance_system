import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Store,
    MessageSquare,
    ShieldCheck,
    LogOut,
    Shield,
    HardDrive,
    Users,
    Menu,
    X,
} from 'lucide-react';
import { showSuccess, showError, showWarning, showToast } from '@/lib/swal';
import ThemeToggle from '@/components/theme-toggle';

interface Props {
    title: string;
    children: React.ReactNode;
}

export default function SuperAdminLayout({ title, children }: Props) {
    const { auth, flash, name }: any = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            showSuccess('Success', flash.success);
        }
        if (flash?.error) {
            showError('Error', flash.error);
        }
        if (flash?.warning) {
            showWarning('Warning', flash.warning);
        }
        if (flash?.info) {
            showToast(flash.info, 'info');
        }
    }, [flash]);

    const handleLogout = () => {
        router.post('/super-admin/logout');
    };

    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems = [
        {
            label: 'System Dashboard',
            href: '/super-admin/dashboard',
            icon: LayoutDashboard,
            active: currentRoute === '/super-admin' || currentRoute === '/super-admin/' || currentRoute.includes('/super-admin/dashboard'),
        },
        {
            label: 'Stores & Admins',
            href: '/super-admin/stores',
            icon: Store,
            active: currentRoute.includes('/super-admin/stores'),
        },
        {
            label: 'Contact Inquiries',
            href: '/super-admin/inquiries',
            icon: MessageSquare,
            active: currentRoute.includes('/super-admin/inquiries'),
        },
        {
            label: 'Super Admin Profile',
            href: '/super-admin/profile',
            icon: ShieldCheck,
            active: currentRoute.includes('/super-admin/profile'),
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle navigation"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    <Link href="/super-admin/dashboard" className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                            <Shield className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                                {name || 'AttendEase'}
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300">
                                    Super Admin
                                </span>
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <ThemeToggle variant="dropdown" />

                    <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {auth?.super_admin?.name || 'Root Administrator'}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                            ({auth?.super_admin?.email || 'admin@super.com'})
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Sign Out"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex">
                {/* Desktop Sidebar Navigation */}
                <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="p-4 space-y-1">
                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Platform Navigation
                        </div>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                        item.active
                                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800/80">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                                <HardDrive className="h-3.5 w-3.5" />
                                <span>Multi-Tenant Root</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Complete oversight across all registered stores, outlet quotas, and storage consumption.
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Mobile Drawer Navigation */}
                {mobileOpen && (
                    <div className="lg:hidden fixed inset-0 z-40 flex">
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setMobileOpen(false)}
                        />
                        <div className="relative w-64 bg-white dark:bg-slate-900 h-full p-4 flex flex-col border-r border-slate-200 dark:border-slate-800">
                            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Super Admin Menu
                            </div>
                            <div className="space-y-1 mt-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                                item.active
                                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

