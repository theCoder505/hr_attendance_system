import { Head, Link, usePage } from '@inertiajs/react';
import { Home, ArrowLeft, AlertTriangle, Compass, ServerCrash, Shield, RefreshCw } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';

interface Props {
    status?: number;
    message?: string;
}

export default function ErrorPage({ status = 404, message }: Props) {
    const { settings, name }: any = usePage().props;
    const brandname = settings?.brandname || name || 'Attendance';

    const errorDetails: Record<number, { title: string; subtitle: string; description: string; icon: any; color: string }> = {
        404: {
            title: '404',
            subtitle: 'Page Not Found',
            description: message || "The page or resource you are looking for doesn't exist, has been removed, or is temporarily unavailable.",
            icon: Compass,
            color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
        },
        500: {
            title: '500',
            subtitle: 'Internal Server Error',
            description: message || 'An unexpected error occurred on our servers. Our engineering team has been notified. Please try refreshing in a moment.',
            icon: ServerCrash,
            color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
        },
        505: {
            title: '505',
            subtitle: 'HTTP Version Not Supported',
            description: message || 'The server does not support the HTTP protocol version used in this request. Please ensure your browser is up-to-date.',
            icon: AlertTriangle,
            color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
        },
        403: {
            title: '403',
            subtitle: 'Access Forbidden',
            description: message || 'You do not have administrative permission to view this resource.',
            icon: AlertTriangle,
            color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
        },
    };

    const details = errorDetails[status] || {
        title: String(status),
        subtitle: 'Error Occurred',
        description: message || 'An unexpected response was received. Please try navigating back or returning to the home page.',
        icon: AlertTriangle,
        color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    };

    const Icon = details.icon;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden transition-colors">
            <Head title={`${details.title} - ${details.subtitle} | ${brandname}`} />

            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
                <Link href="/" className="flex items-center gap-2.5">
                    {settings?.logo ? (
                        <img
                            src={`/storage/${settings.logo}`}
                            alt={brandname}
                            className="h-8 w-auto max-w-[160px] object-contain dark:invert dark:brightness-0"
                        />
                    ) : (
                        <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                                <Shield className="h-4 w-4" />
                            </div>
                            <span className="text-base tracking-tight">{brandname}</span>
                        </div>
                    )}
                </Link>
                <ThemeToggle variant="dropdown" />
            </header>

            {/* Center Content Card */}
            <main className="relative z-10 w-full max-w-md mx-auto my-auto text-center py-8">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
                    {/* Icon Badge */}
                    <div className="inline-flex items-center justify-center">
                        <div className={`h-16 w-16 rounded-2xl border flex items-center justify-center ${details.color} shadow-sm`}>
                            <Icon className="h-8 w-8 stroke-[1.8]" />
                        </div>
                    </div>

                    <div>
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 mb-2">
                            {details.subtitle}
                        </span>
                        <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                            {details.title}
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                            {details.description}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Go Back</span>
                        </button>
                        <Link
                            href="/"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                            <Home className="h-4 w-4" />
                            <span>Return Home</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-4 text-xs text-slate-400 dark:text-slate-500">
                <p>
                    &copy; {new Date().getFullYear()} {brandname}. All rights reserved. &bull;{' '}
                    <a href="/attendance" className="hover:underline text-indigo-600 dark:text-indigo-400">
                        Employee Portal
                    </a>
                </p>
            </footer>
        </div>
    );
}

