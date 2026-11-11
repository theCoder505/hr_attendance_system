import ThemeToggle from '@/components/theme-toggle';
import { Head, Link } from '@inertiajs/react';
import { AlertOctagon, ArrowLeft, CreditCard, HelpCircle, ShieldAlert, Store } from 'lucide-react';

interface Props {
    brandname: string;
    logo: string | null;
    storeName?: string;
    storeId?: string;
}

export default function AttendanceSuspended({ brandname, logo, storeName, storeId }: Props) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
            <Head title={`Service Suspended - ${brandname}`} />

            {/* Top Navbar */}
            <header className="border-b border-slate-200 bg-white/80 px-4 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sticky top-0 z-30">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {logo ? (
                            <img src={`/storage/${logo}`} alt={brandname} className="h-8 w-auto rounded-lg object-contain" />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-sm shadow-md shadow-rose-600/20">
                                !
                            </div>
                        )}
                        <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                            {brandname}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle variant="dropdown" />
                        <Link
                            href="/store/login"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                            <Store className="h-3.5 w-3.5" />
                            <span>Store Login</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-xl w-full px-4 py-12 flex-1 flex items-center justify-center">
                <div className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 mb-5 shadow-sm">
                        <AlertOctagon className="h-8 w-8" />
                    </div>

                    {storeName && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 mb-3">
                            <Store className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{storeName}</span>
                            {storeId && <span className="font-mono text-[10px] text-slate-500">({storeId})</span>}
                        </div>
                    )}

                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Attendance Service Suspended
                    </h1>

                    <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                        Employee clock-in and clock-out actions for this store have been paused because the monthly platform subscription payment is overdue.
                    </p>

                    <div className="my-6 p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-left space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-300">
                            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>Action Required by Store Owner</span>
                        </div>
                        <p className="text-xs text-rose-700 dark:text-rose-300/90 leading-relaxed">
                            Please notify your store owner or management to sign in to the Store Portal and settle the outstanding monthly invoice. Services will be restored immediately once verified.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            href="/store/login"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                            <CreditCard className="h-4 w-4" />
                            <span>Store Owner: Pay Invoice Now</span>
                        </Link>
                        <Link
                            href="/user-manual"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer"
                        >
                            <HelpCircle className="h-4 w-4 text-slate-400" />
                            <span>Read User Manual</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white/50 px-4 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
                    <p>&copy; {new Date().getFullYear()} {brandname}. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                            Contact Platform Support
                        </Link>
                        <Link href="/user-manual" className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                            User Manual
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

