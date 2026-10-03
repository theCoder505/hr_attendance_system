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
    PanelLeftClose,
    PanelLeftOpen,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { showSuccess, showError, showWarning, showToast } from '@/lib/swal';
import Swal from 'sweetalert2';
import ThemeToggle from '@/components/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children, title }: Props) {
    const { auth, flash, settings } = usePage<any>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('admin_sidebar_minimized') === 'true';
        }
        return false;
    });

    const toggleMinimize = () => {
        setIsMinimized((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('admin_sidebar_minimized', String(next));
            }
            return next;
        });
    };

    // Keyboard shortcut: Ctrl + B / Cmd + B to toggle sidebar minimize/maximize
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                toggleMinimize();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
        <TooltipProvider delayDuration={150}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-36 h-auto">
                            {settings?.logo ? (
                                <img src={`/storage/${settings.logo}`} alt="Logo" className="w-full h-auto object-contain dark:invert dark:brightness-0" />
                            ) : (
                                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                    <Shield className="h-5 w-5 text-indigo-600" />
                                    <span className="text-sm truncate">{brandname}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle variant="dropdown" />
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label="Toggle menu"
                        >
                            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex">
                    {/* Sidebar Navigation */}
                    <aside
                        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                            } ${isMinimized ? 'lg:w-20' : 'lg:w-64'} w-64`}
                    >
                        {/* Brand header */}
                        <div className={`p-4 border-b border-slate-200 dark:border-slate-800 flex items-center h-[65px] transition-all duration-300 ${isMinimized ? 'lg:justify-center lg:px-2 justify-between px-5' : 'justify-between px-5'
                            }`}>
                            {/* Expanded state on desktop or mobile view */}
                            <div className={cn("flex items-center justify-between w-full min-w-0", isMinimized && "lg:hidden")}>
                                <Link href="/administration-control/dashboard" className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                    {settings?.logo ? (
                                        <img src={`/storage/${settings.logo}`} alt="Logo" className="max-h-8 w-auto max-w-[150px] object-contain dark:invert dark:brightness-0" />
                                    ) : (
                                        <div className="flex items-center gap-2.5 font-bold text-base text-slate-900 dark:text-white tracking-tight">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 shrink-0">
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <span className="truncate">{brandname}</span>
                                        </div>
                                    )}
                                </Link>
                            </div>

                            {/* Minimized state on desktop */}
                            <div className={cn("hidden", isMinimized && "lg:flex items-center justify-center w-full")}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href="/administration-control/dashboard"
                                            className="flex items-center justify-center p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            aria-label={brandname}
                                        >
                                            {settings?.favicon ? (
                                                <img src={`/storage/${settings.favicon}`} alt="Logo" className="h-7 w-7 object-contain" />
                                            ) : settings?.logo ? (
                                                <img src={`/storage/${settings.logo}`} alt="Logo" className="h-7 w-7 object-contain dark:invert dark:brightness-0" />
                                            ) : (
                                                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                            )}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={12}>
                                        {brandname}
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Close button for mobile drawer */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                aria-label="Close sidebar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Nav Items */}
                        <nav className={cn("flex-1 p-3 space-y-1.5 overflow-y-auto transition-all", isMinimized ? "lg:px-2 px-4" : "px-4")}>
                            <div className={cn("text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2", isMinimized && "lg:hidden")}>
                                Menu
                            </div>
                            <div className={cn("hidden my-2 border-t border-slate-100 dark:border-slate-800 mx-2", isMinimized && "lg:block")} />

                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const linkElement = (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            "flex items-center rounded-lg text-sm font-medium transition-all group",
                                            isMinimized
                                                ? "gap-3 px-3.5 py-2.5 lg:justify-center lg:p-2.5 lg:gap-0"
                                                : "gap-3 px-3.5 py-2.5",
                                            item.active
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4 shrink-0", item.active ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                                        <span className={cn("truncate ml-3 transition-opacity duration-200", isMinimized && "lg:hidden")}>
                                            {item.label}
                                        </span>
                                    </Link>
                                );

                                if (isMinimized) {
                                    return (
                                        <Tooltip key={item.href}>
                                            <TooltipTrigger asChild>
                                                {linkElement}
                                            </TooltipTrigger>
                                            <TooltipContent side="right" sideOffset={12} className="hidden lg:block">
                                                {item.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                }

                                return linkElement;
                            })}

                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className={cn("text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2", isMinimized && "lg:hidden")}>
                                    Public Portals
                                </div>
                                <div className={cn("hidden my-1 border-t border-slate-100 dark:border-slate-800 mx-2", isMinimized && "lg:block")} />

                                {isMinimized ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <a
                                                href="/attendance"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between px-3.5 py-2.5 lg:justify-center lg:p-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                            >
                                                <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                                                <span className="truncate ml-3 lg:hidden">Employee Portal</span>
                                                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 lg:hidden" />
                                            </a>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={12} className="hidden lg:block">
                                            Employee Portal (Open in new tab)
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
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
                                )}
                            </div>
                        </nav>

                        {/* Admin User Footer Profile */}
                        <div className={cn("border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-all", isMinimized ? "lg:p-2.5 p-4" : "p-4")}>
                            {/* Full profile for expanded desktop or mobile */}
                            <div className={cn("flex items-center justify-between", isMinimized && "lg:hidden")}>
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

                            {/* Compact profile for minimized desktop */}
                            <div className={cn("hidden", isMinimized && "lg:flex flex-col items-center gap-2")}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0 cursor-default">
                                            {auth?.admin?.name?.substring(0, 2).toUpperCase() || 'AD'}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={12}>
                                        <p className="font-semibold">{auth?.admin?.name || 'Administrator'}</p>
                                        <p className="text-xs text-slate-400">{auth?.admin?.email}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                            aria-label="Log Out"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={12}>
                                        Log Out
                                    </TooltipContent>
                                </Tooltip>
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
                    <main className={cn(
                        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
                        isMinimized ? "lg:pl-20" : "lg:pl-64"
                    )}>
                        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 hidden lg:flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleMinimize}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title={isMinimized ? "Maximize sidebar (Ctrl+B)" : "Minimize sidebar (Ctrl+B)"}
                                    aria-label={isMinimized ? "Maximize sidebar" : "Minimize sidebar"}
                                >
                                    {isMinimized ? (
                                        <PanelLeftOpen className="h-5 w-5" />
                                    ) : (
                                        <PanelLeftClose className="h-5 w-5" />
                                    )}
                                </button>
                                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                    {title || 'Administration Portal'}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800/40">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Session Active ({auth?.admin?.session_time || 30}m timeout)
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-9xl w-full mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
