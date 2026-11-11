import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    FileText,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Copy,
    Check,
    Calendar,
    Building2,
    Smartphone,
    Send,
    HelpCircle,
} from 'lucide-react';
import { formatHumanDueDate, getOrdinalDay } from '@/lib/utils';
import Swal from 'sweetalert2';

interface Invoice {
    id: number;
    invoice_number: string;
    billing_month: string;
    amount: string | number;
    paid_amount?: string | number | null;
    due_date: string;
    status: 'unpaid' | 'pending' | 'paid' | 'rejected' | 'pending_verification';
    payment_method?: string | null;
    transaction_id?: string | null;
    payment_time?: string | null;
    payment_note?: string | null;
    rejection_reason?: string | null;
    submitted_at?: string | null;
    verified_at?: string | null;
}

interface PlatformSettings {
    bkash_number?: string | null;
    bkash_type?: string | null;
    bkash_enabled?: boolean;
    nagad_number?: string | null;
    nagad_type?: string | null;
    nagad_enabled?: boolean;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    bank_branch?: string | null;
    bank_routing?: string | null;
    bank_enabled?: boolean;
    payment_due_day: number;
}

interface Props {
    invoices: Invoice[];
    isSuspended: boolean;
    platformSettings: PlatformSettings;
}

export default function StoreInvoicesPage({ invoices, isSuspended, platformSettings }: Props) {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        paid_amount: '',
        payment_method: 'bkash',
        transaction_id: '',
        payment_time: '',
        payment_note: '',
    });

    const openPaymentModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);

        // Determine default payment method among enabled options
        let defaultMethod = 'other';
        if (platformSettings.bkash_enabled !== false) defaultMethod = 'bkash';
        else if (platformSettings.nagad_enabled !== false) defaultMethod = 'nagad';
        else if (platformSettings.bank_enabled !== false) defaultMethod = 'bank';

        const currentMethod = (invoice.payment_method as any) || defaultMethod;

        setData({
            paid_amount: invoice.paid_amount ? String(invoice.paid_amount) : String(invoice.amount),
            payment_method: currentMethod,
            transaction_id: invoice.transaction_id || '',
            payment_time: invoice.payment_time ? invoice.payment_time.substring(0, 16) : new Date().toISOString().substring(0, 16),
            payment_note: invoice.payment_note || '',
        });
    };

    const closePaymentModal = () => {
        setSelectedInvoice(null);
        reset();
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        post(`/store/invoices/${selectedInvoice.id}/pay`, {
            preserveScroll: true,
            onSuccess: () => {
                closePaymentModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Payment Submitted',
                    text: 'Your payment details have been submitted. Super Admin will verify it shortly.',
                    timer: 3000,
                    showConfirmButton: false,
                });
            },
        });
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getStatusBadge = (status: Invoice['status']) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid & Active
                    </span>
                );
            case 'pending':
            case 'pending_verification':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Verification Pending
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected / Repay
                    </span>
                );
            case 'unpaid':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Unpaid
                    </span>
                );
        }
    };

    return (
        <AdminLayout>
            <Head title="Billing & Invoices - Store Portal" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                                <CreditCard className="w-4 h-4" />
                                Store Billing & Subscriptions
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Monthly Invoices</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Maintain uninterrupted employee attendance check-ins by clearing monthly invoices by the{' '}
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {getOrdinalDay(platformSettings.payment_due_day)}
                                </span>{' '}
                                of every month.
                            </p>
                        </div>

                        {isSuspended ? (
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-sm font-medium">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>Service currently suspended</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>Service active & good standing</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Overdue Alert banner if suspended */}
                {isSuspended && (
                    <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <div className="text-sm space-y-1">
                            <p className="font-semibold">Attendance service is temporarily suspended!</p>
                            <p className="text-rose-700 dark:text-rose-300">
                                Your account is past the monthly payment deadline ({getOrdinalDay(platformSettings.payment_due_day)} of the month). Employees cannot check in or out until the current month's invoice is paid and verified by Super Admin.
                            </p>
                        </div>
                    </div>
                )}

                {/* Invoices List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Billing History
                        </h2>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Total {invoices.length} invoices</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/75 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-5">Invoice #</th>
                                    <th className="py-3.5 px-5">Billing Month</th>
                                    <th className="py-3.5 px-5">Amount</th>
                                    <th className="py-3.5 px-5">Due Date</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5">Payment Details</th>
                                    <th className="py-3.5 px-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500">
                                            No invoices found.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-5 font-mono font-medium text-slate-900 dark:text-white">
                                                {inv.invoice_number}
                                            </td>
                                            <td className="py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    {inv.billing_month}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                                                ৳ {Number(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                                                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                    <span>{formatHumanDueDate(inv.due_date, platformSettings.payment_due_day)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                {getStatusBadge(inv.status)}
                                            </td>
                                            <td className="py-4 px-5 text-xs text-slate-600 dark:text-slate-300">
                                                {inv.transaction_id ? (
                                                    <div className="space-y-0.5">
                                                        <div className="font-semibold uppercase text-slate-800 dark:text-slate-200">
                                                            {inv.payment_method} · <span className="font-mono">{inv.transaction_id}</span>
                                                        </div>
                                                        {inv.paid_amount && (
                                                            <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                                                                Paid: ৳ {Number(inv.paid_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        )}
                                                        {inv.payment_time && (
                                                            <div className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">
                                                                Time: {inv.payment_time}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 dark:text-slate-500 italic">Not submitted</span>
                                                )}

                                                {inv.status === 'rejected' && inv.rejection_reason && (
                                                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                                                        <span className="font-bold">Reason:</span> {inv.rejection_reason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                {inv.status === 'paid' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                        <Check className="w-3.5 h-3.5" />
                                                        Completed
                                                    </span>
                                                ) : (inv.status === 'pending' || inv.status === 'pending_verification') ? (
                                                    <button
                                                        onClick={() => openPaymentModal(inv)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                                                    >
                                                        Edit Details
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openPaymentModal(inv)}
                                                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/20 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                                                    >
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                        {inv.status === 'rejected' ? 'Repay Now' : 'Pay Now'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Submit Monthly Subscription Payment
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Invoice #{selectedInvoice.invoice_number} · Month: {selectedInvoice.billing_month} · Amount: ৳ {selectedInvoice.amount}
                                </p>
                            </div>
                            <button
                                onClick={closePaymentModal}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Rejection Notice if any */}
                        {selectedInvoice.status === 'rejected' && selectedInvoice.rejection_reason && (
                            <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200">
                                <p className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                                    <AlertCircle className="w-4 h-4" />
                                    Previous payment was rejected:
                                </p>
                                <p className="mt-1 pl-5.5">{selectedInvoice.rejection_reason}</p>
                                <p className="mt-1 pl-5.5 font-medium text-rose-600 dark:text-rose-400">Please verify details and re-submit with the correct transaction reference.</p>
                            </div>
                        )}

                        {/* Payment Receiving Accounts */}
                        <div className="mt-5 space-y-3">
                            {/* Required Amount Display Banner */}
                            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                                        Required Invoice Amount
                                    </span>
                                    <div className="text-2xl font-black text-indigo-950 dark:text-indigo-100">
                                        ৳ {Number(selectedInvoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                                        Please send this exact monthly amount to any of the official receiving accounts below.
                                    </p>
                                </div>
                                <div className="sm:text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                                    <span className="block font-sans font-semibold text-slate-700 dark:text-slate-300">
                                        Due Date: {formatHumanDueDate(selectedInvoice.due_date, platformSettings.payment_due_day)}
                                    </span>
                                    <span className="text-[11px] text-slate-400">({selectedInvoice.due_date})</span>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                                <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Super Admin Payment Receiving Accounts
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {/* bKash */}
                                {platformSettings.bkash_enabled !== false && (
                                    <div className="p-3.5 rounded-2xl bg-pink-50/70 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 space-y-1">
                                        <div className="flex items-center justify-between font-bold text-pink-700 dark:text-pink-300">
                                            <span className="flex items-center gap-1.5">
                                                <Smartphone className="w-3.5 h-3.5" />
                                                bKash ({platformSettings.bkash_type || 'Personal'})
                                            </span>
                                            {platformSettings.bkash_number && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(platformSettings.bkash_number!, 'bkash')}
                                                    className="text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-200 flex items-center gap-1 text-[11px] cursor-pointer"
                                                >
                                                    {copiedField === 'bkash' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    {copiedField === 'bkash' ? 'Copied' : 'Copy'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                                            {platformSettings.bkash_number || 'Not configured by Super Admin'}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Send Money / Payment to this number</p>
                                    </div>
                                )}

                                {/* Nagad */}
                                {platformSettings.nagad_enabled !== false && (
                                    <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
                                        <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-300">
                                            <span className="flex items-center gap-1.5">
                                                <Smartphone className="w-3.5 h-3.5" />
                                                Nagad ({platformSettings.nagad_type || 'Personal'})
                                            </span>
                                            {platformSettings.nagad_number && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(platformSettings.nagad_number!, 'nagad')}
                                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 flex items-center gap-1 text-[11px] cursor-pointer"
                                                >
                                                    {copiedField === 'nagad' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    {copiedField === 'nagad' ? 'Copied' : 'Copy'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                                            {platformSettings.nagad_number || 'Not configured by Super Admin'}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Send Money / Payment to this number</p>
                                    </div>
                                )}

                                {/* Bank */}
                                {platformSettings.bank_enabled !== false && (
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1 md:col-span-2">
                                        <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                                            <span className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                Bank Account Details
                                            </span>
                                            {platformSettings.bank_account_number && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(platformSettings.bank_account_number!, 'bank')}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 flex items-center gap-1 text-[11px] cursor-pointer"
                                                >
                                                    {copiedField === 'bank' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    {copiedField === 'bank' ? 'Copied' : 'Copy'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                                            <div>
                                                <span className="text-slate-400 dark:text-slate-500 block">Bank Name</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{platformSettings.bank_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 dark:text-slate-500 block">Account Name</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{platformSettings.bank_account_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 dark:text-slate-500 block">Account Number</span>
                                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{platformSettings.bank_account_number || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 dark:text-slate-500 block">Branch / Routing</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {platformSettings.bank_branch || 'N/A'} {platformSettings.bank_routing ? `(${platformSettings.bank_routing})` : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Fallback when all accounts disabled */}
                                {platformSettings.bkash_enabled === false &&
                                    platformSettings.nagad_enabled === false &&
                                    platformSettings.bank_enabled === false && (
                                        <div className="md:col-span-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                                            Direct online receiving channels are temporarily paused by Super Admin. Please contact platform support for manual payment coordination.
                                        </div>
                                )}
                            </div>
                        </div>

                        {/* Submission Form */}
                        <form onSubmit={handlePaymentSubmit} className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Amount Paid (৳) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500 text-sm">৳</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            value={data.paid_amount}
                                            onChange={(e) => setData('paid_amount', e.target.value)}
                                            placeholder={`e.g. ${selectedInvoice.amount}`}
                                            className="w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-4 py-2.5 font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20"
                                            required
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                        Enter the actual total amount you deposited/transferred. Must match the invoice requirement (৳ {selectedInvoice.amount}).
                                    </p>
                                    {errors.paid_amount && (
                                        <p className="text-xs text-rose-500 mt-1">{errors.paid_amount}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Payment Method Used <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.payment_method}
                                        onChange={(e) => setData('payment_method', e.target.value)}
                                        className="p-3.5 w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20 py-2.5"
                                        required
                                    >
                                        {platformSettings.bkash_enabled !== false && <option value="bkash">bKash</option>}
                                        {platformSettings.nagad_enabled !== false && <option value="nagad">Nagad</option>}
                                        {platformSettings.bank_enabled !== false && <option value="bank">Bank Transfer</option>}
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.payment_method && (
                                        <p className="text-xs text-rose-500 mt-1">{errors.payment_method}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Transaction ID (TrxID) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.transaction_id}
                                        onChange={(e) => setData('transaction_id', e.target.value)}
                                        placeholder="e.g. 9J28DA10KX"
                                        className="p-3.5 w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20 font-mono py-2.5"
                                        required
                                    />
                                    {errors.transaction_id && (
                                        <p className="text-xs text-rose-500 mt-1">{errors.transaction_id}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Approx. Payment Time <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.payment_time}
                                        onChange={(e) => setData('payment_time', e.target.value)}
                                        className="p-3.5 w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20 py-2.5 font-mono"
                                        required
                                    />
                                    {errors.payment_time && (
                                        <p className="text-xs text-rose-500 mt-1">{errors.payment_time}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Sender Number / Bank Reference (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.payment_note}
                                        onChange={(e) => setData('payment_note', e.target.value)}
                                        placeholder="e.g. Sent from 017xxxxxxxx or depositor name"
                                        className="p-3.5 w-full text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20 py-2.5"
                                    />
                                    {errors.payment_note && (
                                        <p className="text-xs text-rose-500 mt-1">{errors.payment_note}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm shadow-indigo-600/25 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {processing ? 'Submitting...' : 'Submit for Verification'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
