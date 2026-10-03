import { Link } from '@inertiajs/react';
import {
    Calendar,
    Users,
    FileSpreadsheet,
    Settings,
    Clock,
    LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminBottomNavProps {
    currentRoute: string;
    auth?: any;
    onLogout: () => void;
}

export default function AdminBottomNav({ currentRoute, onLogout }: AdminBottomNavProps) {
    const items = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            href: '/administration-control/dashboard',
            icon: Calendar,
            active:
                currentRoute.includes('/administration-control/dashboard') ||
                currentRoute === '/administration-control' ||
                currentRoute === '/administration-control/',
        },
        {
            key: 'employees',
            label: 'Employees',
            href: '/administration-control/employees',
            icon: Users,
            active: currentRoute.includes('/administration-control/employees'),
        },
        {
            key: 'report',
            label: 'Report',
            href: '/administration-control/reports',
            icon: FileSpreadsheet,
            active: currentRoute.includes('/administration-control/reports'),
        },
        {
            key: 'settings',
            label: 'Settings',
            href: '/administration-control/settings',
            icon: Settings,
            active: currentRoute.includes('/administration-control/settings'),
        },
        {
            key: 'portal',
            label: 'Portal',
            href: '/attendance',
            icon: Clock,
            active: currentRoute.startsWith('/attendance'),
            isExternalOrNative: false,
        },
        {
            key: 'logout',
            label: 'Logout',
            onClick: onLogout,
            icon: LogOut,
            active: false,
            isAction: true,
        },
    ];

    return (
        <nav
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
            aria-label="Mobile Bottom Navigation"
        >
            <div className="w-full max-w-xl mx-auto px-2 sm:px-4">
                <div className="relative h-[66px] bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between h-full px-1">
                        {items.map((item) => {
                            const Icon = item.icon;

                            if (item.active) {
                                return (
                                    <div
                                        key={item.key}
                                        className="flex-1 flex flex-col items-center justify-center py-1 px-0.5 relative h-full select-none"
                                    >
                                        {/* Notch Cutout into the bar's top border */}
                                        <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[64px] h-[37px] pointer-events-none z-10">
                                            <svg viewBox="0 0 64 37" className="w-full h-full block" fill="none">
                                                {/* Filled cutout matching the page background */}
                                                <path
                                                    d="M 0,0 L 64,0 L 64,3 L 58,3 C 52,3 49,6 46,11 L 36,26 C 34,30 33,34 32,34 C 31,34 30,30 28,26 L 18,11 C 15,6 12,3 6,3 L 0,3 Z"
                                                    className="fill-slate-50 dark:fill-slate-950"
                                                />
                                                {/* Curved stroke contour matching the bar's border */}
                                                <path
                                                    d="M 0,3.5 L 6,3.5 C 12,3.5 15,6 18,11 L 28,26 C 30,30 31,34 32,34 C 33,34 34,30 36,26 L 46,11 C 49,6 52,3.5 58,3.5 L 64,3.5"
                                                    className="stroke-slate-200/90 dark:stroke-slate-800"
                                                    strokeWidth="1"
                                                    strokeLinecap="round"
                                                    fill="none"
                                                />
                                            </svg>
                                        </div>

                                        {/* Elevated Rotated Square Diamond with upright icon */}
                                        <div className="absolute -top-[16px] left-1/2 -translate-x-1/2 z-20">
                                            <div
                                                className={cn(
                                                    "w-[38px] h-[38px] rounded-[12px] rotate-45 flex items-center justify-center",
                                                    "bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 text-white",
                                                    "shadow-[0_6px_16px_rgba(79,70,229,0.38)] dark:shadow-[0_6px_16px_rgba(99,102,241,0.45)]",
                                                    "transition-transform duration-200"
                                                )}
                                            >
                                                <div className="-rotate-45 flex items-center justify-center">
                                                    <Icon className="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Placeholder matching inactive icon height so title aligns with other items */}
                                        <div className="p-1 h-7 w-7" aria-hidden="true" />

                                        {/* Active Title in same position with active color */}
                                        <span className="text-[10px] tracking-tight font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[54px] text-center leading-tight z-20">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            }

                            // Inactive Item (Shows icon and title label)
                            const content = (
                                <>
                                    <div className="p-1 rounded-lg transition-transform duration-150 group-hover:scale-110">
                                        <Icon className="h-5 w-5 shrink-0" />
                                    </div>
                                    <span className="text-[10px] tracking-tight font-medium truncate max-w-[54px] text-center leading-tight">
                                        {item.label}
                                    </span>
                                </>
                            );

                            const commonClasses = cn(
                                "flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-colors duration-150 group select-none cursor-pointer",
                                item.key === 'logout'
                                    ? "text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            );

                            if (item.isAction) {
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={item.onClick}
                                        className={commonClasses}
                                        aria-label={item.label}
                                    >
                                        {content}
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href!}
                                    className={commonClasses}
                                    aria-label={item.label}
                                >
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
