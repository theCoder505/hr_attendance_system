import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import {
    Store,
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    Building2,
    HardDrive,
    Shield,
    X,
    CheckCircle2,
    ArrowUpRight,
    Lock,
    Mail,
    Sparkles,
    Eye,
    EyeOff,
} from 'lucide-react';
import { showConfirm, showSuccess, showError, showToast } from '@/lib/swal';

interface StoreItem {
    id: number;
    uid: string;
    store_id: string;
    name: string;
    email: string;
    max_outlets: number;
    outlets_count: number;
    employees_count: number;
    storage_bytes: number;
    storage_formatted: string;
    session_time: number;
    two_factor_enabled: boolean;
    created_at: string;
}

interface Props {
    stores: {
        data: StoreItem[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        search: string;
    };
}

export default function StoresIndex({ stores, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Create Form
    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        max_outlets: 5,
        session_time: 30,
        two_factor_enabled: true,
    });

    // Edit Form
    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        max_outlets: 5,
        session_time: 30,
        two_factor_enabled: true,
    });

    // Search filter
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/super-admin/stores', { search: searchTerm }, { preserveState: true });
    };

    // Open Edit Modal
    const handleOpenEdit = (store: StoreItem) => {
        setSelectedStore(store);
        editForm.setData({
            name: store.name,
            email: store.email,
            password: '',
            max_outlets: store.max_outlets,
            session_time: store.session_time || 30,
            two_factor_enabled: store.two_factor_enabled,
        });
        setEditModalOpen(true);
    };

    // Submit Create
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/super-admin/stores', {
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
                showSuccess('Store Created', 'New store tenant registered successfully.');
            },
            onError: (err: any) => {
                showError('Validation Error', Object.values(err)[0] as string);
            },
        });
    };

    // Submit Edit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore) return;

        editForm.put(`/super-admin/stores/${selectedStore.id}`, {
            onSuccess: () => {
                setEditModalOpen(false);
                setSelectedStore(null);
                showSuccess('Store Updated', 'Store configuration and quotas updated successfully.');
            },
            onError: (err: any) => {
                showError('Validation Error', Object.values(err)[0] as string);
            },
        });
    };

    // Delete Store
    const handleDeleteStore = async (store: StoreItem) => {
        const confirmed = await showConfirm(
            `Delete Store "${store.name}"?`,
            `⚠️ DANGER: Deleting this store will permanently wipe all its ${store.outlets_count} outlets, ${store.employees_count} employees, attendances, and stored files! This cannot be undone.`,
            'Yes, Delete Store Permanently',
            'warning'
        );

        if (confirmed) {
            router.delete(`/super-admin/stores/${store.id}`, {
                onSuccess: () => {
                    showSuccess('Store Deleted', `Store "${store.name}" and all associated data was removed.`);
                },
            });
        }
    };

    return (
        <SuperAdminLayout title="Stores & Admins">
            <Head title="Stores Management - Super Admin" />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Store className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        Stores & Tenant Management
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Register new store accounts, set maximum outlet limits, and inspect individual usage and storage.
                    </p>
                </div>

                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Register New Store</span>
                </button>
            </div>

            {/* Search Box */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by store name, email, or Store ID (e.g. STR-MAIN01)..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                    >
                        Search
                    </button>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                router.get('/super-admin/stores');
                            }}
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </form>
            </div>

            {/* Stores Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {stores.data.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500">
                        <Store className="h-10 w-10 mx-auto text-slate-400 mb-3 opacity-50" />
                        <p className="text-sm font-semibold">No stores found</p>
                        <p className="text-xs text-slate-400 mt-1">Try another search or register a new store.</p>
                    </div>
                ) : (
                    stores.data.map((store) => (
                        <div
                            key={store.id}
                            className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                {/* Top Title & Store ID */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                                            {store.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-2.5 py-0.5 rounded-lg">
                                                {store.store_id || store.uid}
                                            </span>
                                            {store.two_factor_enabled ? (
                                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                                                    2FA On
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                    2FA Off
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(store)}
                                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
                                            title="Edit Store & Quotas"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStore(store)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                            title="Delete Store"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="truncate">{store.email}</span>
                                </div>

                                {/* Quotas and Usage Badges */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                                        <span className="text-[10px] text-slate-400 block font-medium">Max Outlets Quota</span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 block">
                                            {store.outlets_count} / {store.max_outlets} Used
                                        </span>
                                    </div>

                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                                        <span className="text-[10px] text-slate-400 block font-medium">Total Storage</span>
                                        <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5 block">
                                            {store.storage_formatted}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-medium">
                                    {store.employees_count} Employees registered
                                </span>

                                <Link
                                    href={`/super-admin/stores/${store.id}/employees`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors"
                                >
                                    <span>Manage Employees</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal: Register Store */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Store className="h-5 w-5 text-purple-600" />
                                Register New Store Admin
                            </h2>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Store / Company Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="e.g. Acme Superstore"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                                {createForm.errors.name && <p className="text-xs text-rose-500">{createForm.errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Admin Email <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={createForm.data.email}
                                        onChange={(e) => createForm.setData('email', e.target.value)}
                                        placeholder="admin@store.com"
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                    {createForm.errors.email && <p className="text-xs text-rose-500">{createForm.errors.email}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Initial Password <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCreatePassword ? 'text' : 'password'}
                                            required
                                            value={createForm.data.password}
                                            onChange={(e) => createForm.setData('password', e.target.value)}
                                            placeholder="Min 8 characters"
                                            className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCreatePassword(!showCreatePassword)}
                                            tabIndex={-1}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                            title={showCreatePassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {createForm.errors.password && <p className="text-xs text-rose-500">{createForm.errors.password}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                        Store ID (Auto-Generated)
                                    </label>
                                    <div className="w-full px-3.5 py-2 font-mono text-xs rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 flex items-center justify-between">
                                        <span>Automatic (e.g. STR-XXXXXX)</span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                            System Assigned
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">Unique Store ID is automatically generated upon registration.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Maximum Allowed Outlets <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        required
                                        value={createForm.data.max_outlets}
                                        onChange={(e) => createForm.setData('max_outlets', parseInt(e.target.value) || 5)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                    {createForm.errors.max_outlets && <p className="text-xs text-rose-500">{createForm.errors.max_outlets}</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="create_two_factor"
                                    checked={createForm.data.two_factor_enabled}
                                    onChange={(e) => createForm.setData('two_factor_enabled', e.target.checked)}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="create_two_factor" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Require 2FA OTP for Store Admin Login
                                </label>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
                                >
                                    {createForm.processing ? 'Creating...' : 'Register Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Store */}
            {editModalOpen && selectedStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Edit2 className="h-5 w-5 text-purple-600" />
                                    Configure Store: {selectedStore.name}
                                </h2>
                                <p className="text-xs font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                                    Store ID: {selectedStore.store_id || selectedStore.uid}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Store Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Admin Email <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.data.email}
                                        onChange={(e) => editForm.setData('email', e.target.value)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Reset Password (Optional)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showEditPassword ? 'text' : 'password'}
                                            value={editForm.data.password}
                                            onChange={(e) => editForm.setData('password', e.target.value)}
                                            placeholder="Leave blank to retain"
                                            className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEditPassword(!showEditPassword)}
                                            tabIndex={-1}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                            title={showEditPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Maximum Allowed Outlets <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        required
                                        value={editForm.data.max_outlets}
                                        onChange={(e) => editForm.setData('max_outlets', parseInt(e.target.value) || 5)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                    <p className="text-[10px] text-slate-500">Currently has {selectedStore.outlets_count} active outlets.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Session Inactivity (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={720}
                                        value={editForm.data.session_time}
                                        onChange={(e) => editForm.setData('session_time', parseInt(e.target.value) || 30)}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="edit_two_factor"
                                    checked={editForm.data.two_factor_enabled}
                                    onChange={(e) => editForm.setData('two_factor_enabled', e.target.checked)}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="edit_two_factor" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Require 2FA OTP for Store Admin Login
                                </label>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
                                >
                                    {editForm.processing ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}

