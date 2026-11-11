import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import {
    MessageSquare,
    Search,
    Reply,
    Trash2,
    CheckCircle2,
    Clock,
    Building2,
    Mail,
    Phone,
    Store,
    Users,
    X,
    Send,
} from 'lucide-react';
import { showConfirm, showSuccess, showError } from '@/lib/swal';

interface InquiryItem {
    id: number;
    company_name: string;
    subject: string;
    email: string;
    phone: string;
    total_outlets: number;
    avg_employees_per_outlet: number;
    message: string;
    status: string;
    reply_message: string | null;
    replied_at: string | null;
    replier?: {
        name: string;
    } | null;
    created_at: string;
}

interface Props {
    inquiries: {
        data: InquiryItem[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    counts: {
        all: number;
        pending: number;
        replied: number;
    };
    filters: {
        status: string;
        search: string;
    };
}

export default function ContactInquiriesIndex({ inquiries, counts, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
    const [replyModalOpen, setReplyModalOpen] = useState(false);

    const replyForm = useForm({
        reply_message: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/super-admin/inquiries',
            { status: filters.status, search: searchTerm },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            '/super-admin/inquiries',
            { status, search: searchTerm },
            { preserveState: true }
        );
    };

    const handleOpenReply = (inquiry: InquiryItem) => {
        setSelectedInquiry(inquiry);
        replyForm.setData({
            reply_message: inquiry.reply_message || '',
        });
        setReplyModalOpen(true);
    };

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInquiry) return;

        replyForm.post(`/super-admin/inquiries/${selectedInquiry.id}/reply`, {
            onSuccess: () => {
                setReplyModalOpen(false);
                setSelectedInquiry(null);
                replyForm.reset();
                showSuccess('Reply Sent!', 'Your email response has been sent to the store owner and saved in database.');
            },
            onError: (err: any) => {
                showError('Error', Object.values(err)[0] as string);
            },
        });
    };

    const handleDeleteInquiry = async (inquiry: InquiryItem) => {
        const confirmed = await showConfirm(
            'Delete Inquiry?',
            `Remove inquiry from "${inquiry.company_name}"?`,
            'Yes, delete',
            'warning'
        );

        if (confirmed) {
            router.delete(`/super-admin/inquiries/${inquiry.id}`, {
                onSuccess: () => showSuccess('Deleted', 'Inquiry removed.'),
            });
        }
    };

    return (
        <SuperAdminLayout title="Store Inquiries">
            <Head title="Contact Inquiries - Super Admin" />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    Store Contact Inquiries & Expansion Leads
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Store owners submit inquiries via the website footer contact form after solving captcha & email OTP verification. Reply directly from this panel to send an official response email.
                </p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => handleStatusFilter('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            filters.status === 'all'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        All ({counts.all})
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStatusFilter('pending')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            filters.status === 'pending'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Pending ({counts.pending})
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStatusFilter('replied')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            filters.status === 'replied'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        Replied ({counts.replied})
                    </button>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search inquiries..."
                            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Inquiries Cards Grid */}
            <div className="space-y-4">
                {inquiries.data.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500">
                        <MessageSquare className="h-10 w-10 mx-auto text-slate-400 mb-3 opacity-50" />
                        <p className="text-sm font-semibold">No inquiries in this category</p>
                        <p className="text-xs text-slate-400 mt-1">New submissions from the website contact page will appear here.</p>
                    </div>
                ) : (
                    inquiries.data.map((inq) => (
                        <div
                            key={inq.id}
                            className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4"
                        >
                            {/* Card Top */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-purple-600 dark:text-purple-400 text-sm shrink-0">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                            {inq.company_name}
                                        </h3>
                                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                            {inq.subject}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            inq.status === 'replied'
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                                        }`}
                                    >
                                        {inq.status === 'replied' ? 'Replied' : 'Pending Reply'}
                                    </span>

                                    <button
                                        onClick={() => handleOpenReply(inq)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                                    >
                                        <Reply className="h-3.5 w-3.5" />
                                        <span>{inq.status === 'replied' ? 'Send Another Reply' : 'Reply by Email'}</span>
                                    </button>

                                    <button
                                        onClick={() => handleDeleteInquiry(inq)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Inquiry"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Meta & Stats info */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{inq.email}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span>{inq.phone}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                    <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span><strong>{inq.total_outlets}</strong> outlets requested</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span><strong>~{inq.avg_employees_per_outlet}</strong> staff / outlet</span>
                                </div>
                            </div>

                            {/* Original Message Box */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {inq.message}
                            </div>

                            {/* Sent Reply Box (if replied) */}
                            {inq.reply_message && (
                                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-1.5 text-xs text-indigo-950 dark:text-indigo-200">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Replied by Super Admin ({inq.replier?.name || 'Administrator'}):
                                        </span>
                                        <span className="font-normal text-slate-400">
                                            {inq.replied_at ? new Date(inq.replied_at).toLocaleString() : ''}
                                        </span>
                                    </div>
                                    <div className="whitespace-pre-wrap pl-5 border-l-2 border-indigo-400">
                                        {inq.reply_message}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal: Reply to Inquiry */}
            {replyModalOpen && selectedInquiry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Reply className="h-5 w-5 text-purple-600" />
                                    Reply to {selectedInquiry.company_name}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Email will be sent to: <strong className="font-mono text-purple-600 dark:text-purple-400">{selectedInquiry.email}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => setReplyModalOpen(false)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleReplySubmit} className="mt-5 space-y-4">
                            {/* Summary snippet */}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <div><strong>Subject:</strong> {selectedInquiry.subject}</div>
                                <div className="line-clamp-2 italic text-slate-500">"{selectedInquiry.message}"</div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Your Email Response <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    required
                                    value={replyForm.data.reply_message}
                                    onChange={(e) => replyForm.setData('reply_message', e.target.value)}
                                    placeholder="Type your official reply here. Provide details on how they can onboard, credentials, or answers to their questions..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-y"
                                />
                                {replyForm.errors.reply_message && (
                                    <p className="text-xs text-rose-500">{replyForm.errors.reply_message}</p>
                                )}
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setReplyModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={replyForm.processing}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>{replyForm.processing ? 'Dispatching Email...' : 'Send Email Response'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}

