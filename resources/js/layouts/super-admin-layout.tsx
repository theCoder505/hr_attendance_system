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
    Menu,
    X,
    CreditCard,
    BookOpen,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { showSuccess, showError, showWarning, showToast } from '@/lib/swal';
import ThemeToggle from '@/components/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
    title: string;
    children: React.ReactNode;
}

export default function SuperAdminLayout({ title, children }: Props) {
    const { auth, flash, name, settings }: any = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('super_admin_sidebar_minimized') === 'true';
        }
        return false;
    });

    const toggleMinimize = () => {
        setIsMinimized((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('super_admin_sidebar_minimized', String(next));
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
    const brandname = settings?.brandname || name || 'AttendEase';
    const logoVersion = settings?.updated_at ? `?v=${encodeURIComponent(settings.updated_at)}` : '';
    const logoUrl = settings?.logo ? `/storage/${settings.logo}${logoVersion}` : null;
    const faviconUrl = settings?.favicon ? `/storage/${settings.favicon}${logoVersion}` : null;

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
            label: 'Invoices & Billing',
            href: '/super-admin/invoices',
            icon: CreditCard,
            active: currentRoute.includes('/super-admin/invoices'),
        },
        {
            label: 'Contact Inquiries',
            href: '/super-admin/inquiries',
            icon: MessageSquare,
            active: currentRoute.includes('/super-admin/inquiries'),
        },
        {
            label: 'User Manual CMS',
            href: '/super-admin/user-manual',
            icon: BookOpen,
            active: currentRoute.includes('/super-admin/user-manual'),
        },
        {
            label: 'Settings',
            href: '/super-admin/settings',
            icon: Settings,
            active: currentRoute.includes('/super-admin/settings'),
        },
    ];

    return (
        <TooltipProvider delayDuration={150}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
                {/* Mobile & Tablet Header */}
                <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Toggle navigation"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>

                        <Link href="/super-admin/dashboard" className="flex items-center gap-2 overflow-hidden min-w-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt="Logo"
                                    className="h-7 w-auto max-w-[140px] object-contain dark:invert dark:brightness-0"
                                />
                            ) : (
                                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                    <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-600/30 shrink-0">
                                        <Shield className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold truncate">{brandname}</span>
                                </div>
                            )}
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 shrink-0">
                                Super Admin
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle variant="dropdown" />
                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            aria-label="Log Out"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex">
                    {/* Desktop Fixed Sidebar Navigation */}
                    <aside
                        className={cn(
                            "hidden lg:flex fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col transition-all duration-300 ease-in-out",
                            isMinimized ? "w-20" : "w-64"
                        )}
                    >
                        {/* Brand Header on top of sidebar */}
                        <div
                            className={cn(
                                "p-4 border-b border-slate-200 dark:border-slate-800 flex items-center h-[65px] transition-all duration-300",
                                isMinimized ? "justify-center px-2" : "justify-between px-5"
                            )}
                        >
                            {/* Expanded state on desktop */}
                            <div className={cn("flex items-center justify-between w-full min-w-0", isMinimized && "lg:hidden")}>
                                <Link href="/super-admin/dashboard" className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt="Logo"
                                            className="max-h-8 w-auto max-w-[150px] object-contain dark:invert dark:brightness-0"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2.5 font-bold text-base text-slate-900 dark:text-white tracking-tight">
                                            <div className="h-8 w-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30 shrink-0">
                                                <Shield className="h-4 w-4" />
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span className="truncate">{brandname}</span>
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300">
                                                    Admin
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            </div>

                            {/* Minimized state on desktop */}
                            <div className={cn("hidden", isMinimized && "lg:flex items-center justify-center w-full")}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href="/super-admin/dashboard"
                                            className="flex items-center justify-center p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            aria-label={brandname}
                                        >
                                            {faviconUrl ? (
                                                <img src={faviconUrl} alt="Logo" className="h-7 w-7 object-contain" />
                                            ) : logoUrl ? (
                                                <img src={logoUrl} alt="Logo" className="h-7 w-7 object-contain dark:invert dark:brightness-0" />
                                            ) : (
                                                <div className="h-8 w-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
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
                        </div>

                        {/* Nav Items */}
                        <nav className={cn("flex-1 p-3 space-y-1.5 overflow-y-auto transition-all", isMinimized ? "lg:px-2 px-4" : "px-4")}>
                            <div className={cn("text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2", isMinimized && "lg:hidden")}>
                                Platform Navigation
                            </div>
                            <div className={cn("hidden my-2 border-t border-slate-100 dark:border-slate-800 mx-2", isMinimized && "lg:block")} />

                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const linkElement = (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center rounded-lg text-sm font-medium transition-all group",
                                            isMinimized
                                                ? "gap-3 px-3.5 py-2.5 lg:justify-center lg:p-2.5 lg:gap-0"
                                                : "gap-3 px-3.5 py-2.5",
                                            item.active
                                                ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
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
                        </nav>

                        {/* Sidebar Footer Info */}
                        <div className={cn("mt-auto p-4 border-t border-slate-200 dark:border-slate-800/80 transition-all", isMinimized ? "lg:p-2" : "p-4")}>
                            {!isMinimized ? (
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs">
                                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                                        <HardDrive className="h-3.5 w-3.5" />
                                        <span>Multi-Tenant Root</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Complete oversight across all registered stores, outlet quotas, and storage consumption.
                                    </p>
                                </div>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center justify-center p-2 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-default">
                                            <HardDrive className="h-4 w-4" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={12}>
                                        Multi-Tenant Root
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </aside>

                    {/* Mobile Drawer Navigation */}
                    {mobileOpen && (
                        <div className="lg:hidden fixed inset-0 z-40 flex">
                            <div
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={() => setMobileOpen(false)}
                            />
                            <div className="relative w-64 bg-white dark:bg-slate-900 h-full p-4 flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-xl">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                                    <Link
                                        href="/super-admin/dashboard"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-2 overflow-hidden min-w-0"
                                    >
                                        {settings?.logo ? (
                                            <img
                                                src={`/storage/${settings.logo}`}
                                                alt="Logo"
                                                className="max-h-7 w-auto max-w-[140px] object-contain dark:invert dark:brightness-0"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                                <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-600/30 shrink-0">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-bold truncate">{brandname}</span>
                                            </div>
                                        )}
                                    </Link>
                                    <button
                                        onClick={() => setMobileOpen(false)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">
                                    Super Admin Menu
                                </div>
                                <div className="space-y-1 mt-1 overflow-y-auto flex-1">
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

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 shrink-0" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <main
                        className={cn(
                            "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
                            isMinimized ? "lg:pl-20" : "lg:pl-64"
                        )}
                    >
                        {/* Desktop Sticky Header */}
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
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                        {title || 'Super Admin Portal'}
                                    </h2>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300">
                                        Super Admin
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                                <ThemeToggle variant="dropdown" />

                                <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs">
                                    <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300 text-xs shrink-0">
                                        {auth?.super_admin?.name?.substring(0, 2).toUpperCase() || 'SA'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            {auth?.super_admin?.name || 'Root Administrator'}
                                        </span>
                                        <span className="text-slate-400 font-mono text-[11px]">
                                            {auth?.super_admin?.email || 'admin@super.com'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    title="Sign Out"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </header>

                        {/* Page Content */}
                        <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
                            <div className="max-w-7xl mx-auto space-y-6">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
