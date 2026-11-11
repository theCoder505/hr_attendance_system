import { Link, usePage } from '@inertiajs/react';
import ThemeToggle from '@/components/theme-toggle';
import { Clock, Wifi } from 'lucide-react';
import React from 'react';

interface SurfaceNavbarProps {
    brandname: string;
    logo: string | null;
    clientIp?: string;
    rightContent?: React.ReactNode;
}

export function SurfaceNavbar({ brandname, logo, clientIp, rightContent }: SurfaceNavbarProps) {
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-3.5 backdrop-blur-md sm:px-8 dark:border-slate-800/80 dark:bg-slate-900/80 transition-colors">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/attendance" className="flex items-center gap-2.5 group transition-opacity hover:opacity-90">
                        {logo ? (
                            <img
                                src={logo.startsWith('http') || logo.startsWith('/') ? logo : `/storage/${logo}`}
                                alt={brandname}
                                className="h-8 max-w-[140px] sm:max-w-[170px] object-contain"
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                                    {brandname}
                                </span>
                            </div>
                        )}
                    </Link>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                    {rightContent}

                    {clientIp && (
                        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600 sm:flex dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                            <Wifi className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                            <span>IP: {clientIp}</span>
                        </div>
                    )}

                    <ThemeToggle variant="dropdown" />
                </div>
            </div>
        </header>
    );
}

interface SurfaceFooterProps {
    brandname: string;
}

export function SurfaceFooter({ brandname }: SurfaceFooterProps) {
    const { url } = usePage();

    const isAttendance = url === '/attendance' || url.startsWith('/attendance?');
    const isContact = url === '/contact' || url.startsWith('/contact?');
    const isUserManual = url === '/user-manual' || url.startsWith('/user-manual?');

    return (
        <footer className="relative z-10 border-t border-slate-200 bg-white/50 px-4 py-5 text-xs text-slate-500 backdrop-blur-sm sm:px-8 dark:border-slate-800/80 dark:bg-slate-950/50 transition-colors">
            <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                    &copy; {new Date().getFullYear()} {brandname}. All rights reserved.
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 font-medium">
                    <Link
                        href="/attendance"
                        className={`transition-colors ${
                            isAttendance
                                ? 'font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-4 decoration-2 decoration-indigo-600 dark:decoration-indigo-400'
                                : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400'
                        }`}
                    >
                        Attendance Portal
                    </Link>

                    <Link
                        href="/contact"
                        className={`transition-colors ${
                            isContact
                                ? 'font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-4 decoration-2 decoration-indigo-600 dark:decoration-indigo-400'
                                : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400'
                        }`}
                    >
                        Contact
                    </Link>

                    <Link
                        href="/user-manual"
                        className={`transition-colors ${
                            isUserManual
                                ? 'font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-4 decoration-2 decoration-indigo-600 dark:decoration-indigo-400'
                                : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400'
                        }`}
                    >
                        User Manual
                    </Link>
                </nav>
            </div>
        </footer>
    );
}

interface SurfaceLayoutProps {
    brandname: string;
    logo: string | null;
    clientIp?: string;
    rightContent?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function SurfaceLayout({
    brandname,
    logo,
    clientIp,
    rightContent,
    children,
    className = '',
}: SurfaceLayoutProps) {
    return (
        <div className={`min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 ${className}`}>
            <SurfaceNavbar brandname={brandname} logo={logo} clientIp={clientIp} rightContent={rightContent} />

            <div className="flex-1 flex flex-col">
                {children}
            </div>

            <SurfaceFooter brandname={brandname} />
        </div>
    );
}

