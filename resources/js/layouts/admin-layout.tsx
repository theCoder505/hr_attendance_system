import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Calendar,
    Users,
    FileSpreadsheet,
    Settings,
    LogOut,
    Shield,
    Menu,
    X,
    ExternalLink,
    CheckCheck,
    Clock,
} from 'lucide-react';
import { showSuccess, showError, showWarning, showToast } from '@/lib/swal';
import Swal from 'sweetalert2';
import ThemeToggle from '@/components/theme-toggle';

interface Props {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: Props) {
    const { auth, flash, settings } = usePage<any>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Handle flash messages using SweetAlert2
    useEffect(() => {
        if (flash?.success) {
            if (flash?.new_verification_link) {
                Swal.fire({
                    title: 'New Verification Link Generated!',
                    html: `
                        <p class="text-sm text-gray-500 mb-3">${flash.success}</p>
                        <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono break-all select-all text-blue-600 dark:text-blue-400 mb-4">
                            ${flash.new_verification_link}
                        </div>
                        <p class="text-xs text-gray-400">Send this single-use link to the employee's registered device.</p>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Copy Link',
                    cancelButtonText: 'Close',
                    customClass: {
                        confirmButton: 'bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm',
                        cancelButton: 'bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium text-sm ml-2',
                    },
                    buttonsStyling: false,
                }).then((res) => {
                    if (res.isConfirmed) {
                        navigator.clipboard.writeText(flash.new_verification_link);
                        showToast('Link copied to clipboard!', 'success');
                    }
                });
            } else {
                showSuccess(flash.success);
            }
        }
        if (flash?.error) {
            showError(flash.error);
        }
        if (flash?.warning) {
            showWarning(flash.warning);
        }
    }, [flash]);

    const handleLogout = () => {
        router.post('/administration-control/logout');
    };

    const currentRoute = window.location.pathname;

    const navItems = [
        {
            label: 'Dashboard & Calendar',
            href: '/administration-control/dashboard',
            icon: Calendar,
            active: currentRoute.includes('/administration-control/dashboard') || currentRoute === '/administration-control' || currentRoute === '/administration-control/',
        },
        {
            label: 'Employees',
            href: '/administration-control/employees',
            icon: Users,
            active: currentRoute.includes('/administration-control/employees'),
        },
        {
            label: 'Monthly Reports',
            href: '/administration-control/reports',
            icon: FileSpreadsheet,
            active: currentRoute.includes('/administration-control/reports'),
        },
        {
            label: 'Settings & Security',
            href: '/administration-control/settings',
            icon: Settings,
            active: currentRoute.includes('/administration-control/settings'),
        },
    ];

    const brandname = settings?.brandname || 'AttendEase Pro';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                        {settings?.logo ? (
                            <img src={`/storage/${settings.logo}`} alt="Logo" className="h-6 w-6 object-contain" />
                        ) : (
                            <Shield className="h-5 w-5" />
                        )}
                    </div>
                    <span className="font-bold text-base tracking-tight">{brandname}</span>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle variant="dropdown" />
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Sidebar Navigation */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    {/* Brand header */}
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
                                {settings?.logo ? (
                                    <img src={`/storage/${settings.logo}`} alt="Logo" className="h-7 w-7 object-contain" />
                                ) : (
                                    <Shield className="h-5 w-5" />
                                )}
                            </div>
                            <div>
                                <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                                    {brandname}
                                </h1>
                                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                                    Administration
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                            Menu
                        </div>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        item.active
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
                                Public Portals
                            </div>
                            <a
                                href="/attendance"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Clock className="h-4 w-4 text-emerald-500" />
                                    Employee Portal
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
                            </a>
                        </div>
                    </nav>

                    {/* Admin User Footer Profile */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0">
                                    {auth?.admin?.name?.substring(0, 2).toUpperCase() || 'AD'}
                                </div>
                                <div className="truncate">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                        {auth?.admin?.name || 'Administrator'}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                        {auth?.admin?.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <ThemeToggle variant="dropdown" className="border-0 bg-transparent shadow-none" />
                                <button
                                    onClick={handleLogout}
                                    title="Log Out"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    />
                )}

                {/* Main Content Area */}
                <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
                    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 hidden lg:flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                {title || 'Administration Portal'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeToggle variant="dropdown" />
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800/40">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Session Active ({auth?.admin?.session_time || 30}m timeout)
                            </div>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Logout
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
