import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import {
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    AlertCircle,
    Store,
    Calendar,
    ArrowUpRight,
    Filter,
    X,
    Building2,
    Smartphone,
} from 'lucide-react';
import { showConfirm, showSuccess, showError, showToast } from '@/lib/swal';
import { formatHumanDueDate } from '@/lib/utils';

interface InvoiceItem {
    id: number;
    admin_id: number;
    invoice_number: string;
    billing_month: string;
    amount: string | number;
    paid_amount?: string | number | null;
    due_date: string;
    status: 'unpaid' | 'pending_verification' | 'paid' | 'rejected';
    payment_method: string | null;
    transaction_id: string | null;
    payment_time: string | null;
    payment_note: string | null;
    rejection_reason: string | null;
    submitted_at: string | null;
    verified_at: string | null;
    admin?: {
        id: number;
        name: string;
        store_id: string;
        email: string;
    };
    verifier?: {
        id: number;
        name: string;
    };
}

interface Props {
    invoices: {
        data: InvoiceItem[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        status: string;
        search: string;
    };
    counts: {
        all: number;
        pending_verification: number;
        paid: number;
        unpaid: number;
        rejected: number;
    };
}

export default function SuperAdminInvoices({ invoices, filters, counts }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/super-admin/invoices', { status: filters.status, search: searchTerm }, { preserveState: true });
    };

    const handleFilterStatus = (newStatus: string) => {
        router.get('/super-admin/invoices', { status: newStatus, search: searchTerm }, { preserveState: true });
    };

    const handleVerify = async (inv: InvoiceItem) => {
        const confirmed = await showConfirm(
            `Verify & Accept Payment for ${inv.invoice_number}?`,
            `Store: ${inv.admin?.name || 'Store'} | Amount: ${inv.amount} BDT | TrxID: ${inv.transaction_id || 'N/A'}. This will mark the current month invoice as PAID and activate attendance services immediately.`,
            'Yes, Verify & Accept',
            'question'
        );

        if (confirmed) {
            router.post(`/super-admin/invoices/${inv.id}/verify`, {}, {
                onSuccess: () => showToast(`Invoice ${inv.invoice_number} verified and marked as PAID!`, 'success'),
            });
        }
    };

    const handleOpenReject = (inv: InvoiceItem) => {
        setSelectedInvoice(inv);
        rejectForm.setData({ rejection_reason: '' });
        setRejectModalOpen(true);
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        rejectForm.post(`/super-admin/invoices/${selectedInvoice.id}/reject`, {
            onSuccess: () => {
                setRejectModalOpen(false);
                setSelectedInvoice(null);
                showToast('Payment rejected. Store owner notified with rejection reason.', 'warning');
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paid
                    </span>
                );
            case 'pending_verification':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60 animate-pulse">
                        <Clock className="h-3.5 w-3.5" />
                        Pending Verification
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60">
                        <XCircle className="h-3.5 w-3.5" />
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                        Unpaid
                    </span>
                );
        }
    };

    return (
        <SuperAdminLayout title="Store Invoices & Subscription Billing">
            <Head title="Store Invoices & Billing - Super Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            Store Invoices & Billing Management
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Verify monthly subscription transactions submitted by store owners, review transaction IDs, or reject with feedback.
                        </p>
                    </div>
                </div>

                {/* Filter Pills & Search */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 sm:p-4 shadow-sm">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                        <button
                            type="button"
                            onClick={() => handleFilterStatus('all')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filters.status === 'all'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            All ({counts.all})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterStatus('pending_verification')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                filters.status === 'pending_verification'
                                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            }`}
                        >
                            <Clock className="h-3 w-3" />
                            Pending ({counts.pending_verification})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterStatus('paid')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filters.status === 'paid'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                        >
                            Paid ({counts.paid})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterStatus('unpaid')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filters.status === 'unpaid'
                                    ? 'bg-slate-700 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            Unpaid ({counts.unpaid})
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterStatus('rejected')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                filters.status === 'rejected'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                    : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            }`}
                        >
                            Rejected ({counts.rejected})
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative w-full sm:w-64">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search invoice, store, TrxID..."
                                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 cursor-pointer"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Invoices List / Table */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="py-3.5 px-4 sm:px-6">Invoice & Month</th>
                                    <th className="py-3.5 px-4">Store Tenant</th>
                                    <th className="py-3.5 px-4">Amount & Due Date</th>
                                    <th className="py-3.5 px-4">Payment Details (TrxID)</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoices.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            <CreditCard className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2 opacity-50" />
                                            <p className="font-semibold text-slate-600 dark:text-slate-400">No invoices found</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Try choosing another filter tab or search query.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.data.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Invoice Number & Month */}
                                            <td className="py-4 px-4 sm:px-6">
                                                <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                                    {inv.invoice_number}
                                                </div>
                                                <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                                                    <Calendar className="h-3 w-3" />
                                                    Billing: {inv.billing_month}
                                                </div>
                                            </td>

                                            {/* Store Tenant */}
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {inv.admin?.name || 'Store'}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                                                    <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                                                        {inv.admin?.store_id}
                                                    </span>
                                                    <span>&bull; {inv.admin?.email}</span>
                                                </div>
                                            </td>

                                            {/* Amount & Due Date */}
                                            <td className="py-4 px-4">
                                                <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                                    ৳ {inv.amount}
                                                </div>
                                                {inv.paid_amount && (
                                                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                        Paid Reported: ৳ {inv.paid_amount}
                                                    </div>
                                                )}
                                                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1">
                                                    Due: {formatHumanDueDate(inv.due_date)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    ({inv.due_date})
                                                </div>
                                            </td>

                                            {/* Payment Details */}
                                            <td className="py-4 px-4 max-w-xs">
                                                {inv.payment_method ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                                {inv.payment_method}
                                                            </span>
                                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                                                                {inv.transaction_id}
                                                            </span>
                                                        </div>
                                                        {inv.payment_time && (
                                                            <div className="text-[11px] text-slate-400">
                                                                Time: {inv.payment_time}
                                                            </div>
                                                        )}
                                                        {inv.payment_note && (
                                                            <div className="text-[11px] text-slate-500 italic truncate" title={inv.payment_note}>
                                                                Note: "{inv.payment_note}"
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">
                                                        No payment submitted yet
                                                    </span>
                                                )}

                                                {inv.status === 'rejected' && inv.rejection_reason && (
                                                    <div className="mt-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300">
                                                        <strong>Reason:</strong> {inv.rejection_reason}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-4">
                                                {getStatusBadge(inv.status)}
                                                {inv.verified_at && (
                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                        Verified by {inv.verifier?.name || 'Super Admin'}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-4 sm:px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {inv.status === 'pending_verification' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleVerify(inv)}
                                                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1"
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                Verify
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenReject(inv)}
                                                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {inv.status === 'unpaid' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerify(inv)}
                                                            className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                            title="Manually mark paid"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}

                                                    {inv.status === 'paid' && (
                                                        <span className="text-xs text-slate-400">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {invoices.last_page > 1 && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Page {invoices.current_page} of {invoices.last_page} &bull; Total {invoices.total} invoices
                            </span>
                            <div className="flex gap-1.5">
                                {invoices.links.map((link: any, idx: number) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-purple-600 text-white'
                                                : link.url
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                : 'text-slate-400 cursor-not-allowed opacity-50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Reject Payment */}
            {rejectModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                                    <XCircle className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                        Reject Payment Transaction
                                    </h3>
                                    <p className="text-[11px] font-mono text-slate-400">{selectedInvoice.invoice_number}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectModalOpen(false)}
                                className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                            <p><strong>Store:</strong> {selectedInvoice.admin?.name}</p>
                            <p><strong>Method & TrxID:</strong> {selectedInvoice.payment_method?.toUpperCase()} &bull; <span className="font-mono">{selectedInvoice.transaction_id}</span></p>
                            <p><strong>Invoice Due Amount:</strong> ৳ {selectedInvoice.amount}</p>
                            {selectedInvoice.paid_amount && (
                                <p><strong>Amount Paid (by Owner):</strong> <span className="font-bold text-emerald-600 dark:text-emerald-400">৳ {selectedInvoice.paid_amount}</span></p>
                            )}
                        </div>

                        <form onSubmit={handleRejectSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Rejection Reason <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={rejectForm.data.rejection_reason}
                                    onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                    placeholder="e.g. Transaction ID not found on statement, Amount sent (400 BDT) is less than invoice amount (500 BDT)..."
                                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                />
                                <p className="text-[11px] text-slate-400">
                                    This explanation will be displayed to the store owner so they can fix and repay.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing || !rejectForm.data.rejection_reason.trim()}
                                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {rejectForm.processing ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}

