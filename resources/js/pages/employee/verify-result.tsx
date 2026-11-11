import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AlertOctagon, ArrowRight, Laptop, Clock, CheckCircle2 } from 'lucide-react';
import { showToast } from '@/lib/swal';
import SurfaceLayout from '@/components/surface-layout';

interface Props {
    status: 'success' | 'expired' | 'invalid';
    message?: string;
    raw_token?: string;
    store_id?: string;
    store_name?: string;
    outlet_uid?: string;
    outlet?: {
        id: number;
        uid: string;
        name: string;
    } | null;
    employee?: {
        name: string;
        uid: string;
        role: string;
    };
    expires_at?: string;
    brandname: string;
    logo?: string | null;
}

export default function VerifyResult({
    status,
    message,
    raw_token,
    store_id,
    store_name,
    outlet_uid,
    outlet,
    employee,
    expires_at,
    brandname,
    logo = null,
}: Props) {
    useEffect(() => {
        if (status === 'success' && raw_token) {
            localStorage.setItem('device_token', raw_token);
            if (store_id) {
                localStorage.setItem('store_id', store_id);
            }
            const uidToStore = outlet_uid || outlet?.uid;
            if (uidToStore) {
                localStorage.setItem('outlet_uid', uidToStore);
            }
            showToast('Device, Store & Outlet successfully authenticated!', 'success');
        }
    }, [status, raw_token, store_id, outlet_uid, outlet]);

    return (
        <SurfaceLayout brandname={brandname} logo={logo}>
            <Head title={`Device Authentication - ${brandname}`} />

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
                    {status === 'success' ? (
                        <>
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-5 shadow-lg shadow-emerald-500/10">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                                Device Verified!
                            </h1>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                This browser has been cryptographically linked to your company profile. You can now log your attendance seamlessly.
                            </p>

                            {employee && (
                                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                                        <span className="text-slate-500">Employee:</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{employee.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                                        <span className="text-slate-500">ID / Role:</span>
                                        <span className="font-mono text-slate-700 dark:text-slate-300">{employee.uid} ({employee.role})</span>
                                    </div>
                                    {store_name && (
                                        <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                                            <span className="text-slate-500">Store:</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{store_name}</span>
                                        </div>
                                    )}
                                    {outlet && (
                                        <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                                            <span className="text-slate-500">Outlet:</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{outlet.name}</span>
                                        </div>
                                    )}
                                    {expires_at && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-slate-500">Token Active Till:</span>
                                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{expires_at}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl mb-6 flex items-center gap-2.5 text-left text-xs text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>Security token saved locally. Each daily check-in automatically extends validity by 1 month.</span>
                            </div>

                            <Link
                                href="/attendance"
                                className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 px-5 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                <span>Proceed to Attendance Portal</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 mb-5 shadow-lg shadow-rose-500/10">
                                <AlertOctagon className="h-10 w-10" />
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                                Verification Failed
                            </h1>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                {message || 'This verification link is either invalid, already used, or expired.'}
                            </p>

                            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-left text-xs text-slate-600 dark:text-slate-400 mb-6 space-y-2">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">How to resolve this:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                                    <li>Contact your system administrator or HR manager.</li>
                                    <li>Ask them to click <strong className="text-slate-900 dark:text-white">"Re-verify / Change device"</strong> on your profile.</li>
                                    <li>Open the newly generated link directly on this device.</li>
                                </ul>
                            </div>

                            <Link
                                href="/attendance"
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                Back to Attendance Portal
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </SurfaceLayout>
    );
}
