import FileUploadPreview from '@/components/file-upload-preview';
import ImageUploadPreview from '@/components/image-upload-preview';
import AdminLayout from '@/layouts/admin-layout';
import { showConfirm, showError, showToast } from '@/lib/swal';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, Copy, Edit3, Eye, FileText, RefreshCw, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    employees: {
        data: any[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        search: string;
        status: string;
    };
    defaultTimes: {
        check_in_time: string;
        check_out_time: string;
    };
    appUrl: string;
}

export default function EmployeeIndex({ employees, filters, defaultTimes, appUrl }: Props) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Form for creating new employee
    const createForm = useForm({
        name: '',
        phone: '',
        role: '',
        work_desc: '',
        salary: '6000',
        working_hours: '8.00',
        check_in_time: defaultTimes.check_in_time || '09:00',
        check_out_time: defaultTimes.check_out_time || '17:00',
        joining_date: new Date().toISOString().split('T')[0],
        image: null as File | null,
        appointment_letter: null as File | null,
    });

    // Form for editing employee
    const editForm = useForm({
        name: '',
        phone: '',
        role: '',
        work_desc: '',
        salary: '',
        working_hours: '',
        check_in_time: '',
        check_out_time: '',
        joining_date: '',
        image: null as File | null,
        appointment_letter: null as File | null,
    });

    // Search & Filter
    const handleFilter = (searchVal = searchTerm, statusVal = statusFilter) => {
        router.get('/administration-control/employees', { search: searchVal, status: statusVal }, { preserveState: true });
    };

    // Open Edit Modal
    const openEdit = (emp: any) => {
        setSelectedEmployee(emp);
        editForm.setData({
            name: emp.name,
            phone: emp.phone,
            role: emp.role,
            work_desc: emp.work_desc || '',
            salary: String(emp.salary),
            working_hours: String(emp.working_hours),
            check_in_time: emp.check_in_time.substring(0, 5),
            check_out_time: emp.check_out_time.substring(0, 5),
            joining_date: emp.joining_date.substring(0, 10),
            image: null,
            appointment_letter: null,
        });
        setEditModalOpen(true);
    };

    // Open View Details
    const openView = (emp: any) => {
        setSelectedEmployee(emp);
        setViewModalOpen(true);
    };

    // Copy Verification Link
    const copyLink = (token: string | null) => {
        if (!token) {
            showError('This employee already has a verified device. To change their device, click "Re-verify".');
            return;
        }

        const link = `${window.location.origin}/verify/${token}`;
        navigator.clipboard.writeText(link);
        showToast('Verification link copied to clipboard!', 'success');
    };

    // Re-verify / Change device
    const handleReverify = async (emp: any) => {
        const confirmed = await showConfirm(
            'Reset Device & Re-verify?',
            `This will immediately invalidate the old device for ${emp.name} and generate a fresh verification link.`,
            'Yes, reset device',
        );

        if (confirmed) {
            router.post(`/administration-control/employees/${emp.id}/reset-verification`);
        }
    };

    // Delete Employee
    const handleDelete = async (emp: any) => {
        const confirmed = await showConfirm(
            'Delete Employee Record?',
            `Are you sure you want to permanently delete ${emp.name}? All their attendance logs and uploaded documents will be removed.`,
            'Yes, delete employee',
        );

        if (confirmed) {
            router.delete(`/administration-control/employees/${emp.id}`);
        }
    };

    // Submit Create
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/administration-control/employees', {
            onSuccess: () => {
                setCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    // Submit Edit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        editForm.post(`/administration-control/employees/${selectedEmployee.id}`, {
            onSuccess: () => {
                setEditModalOpen(false);
                setSelectedEmployee(null);
            },
        });
    };

    return (
        <AdminLayout title="Employees Management">
            <Head title="Employees - Admin Management" />

            {/* Top Toolbar */}
            <div className="mb-6 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex max-w-lg flex-1 items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, UID, role, phone..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                handleFilter(e.target.value, statusFilter);
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-10 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            handleFilter(searchTerm, e.target.value);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="1">Verified / Active</option>
                        <option value="0">Pending Verification</option>
                    </select>
                </div>

                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500"
                >
                    <UserPlus className="h-4 w-4" />
                    Register New Employee
                </button>
            </div>

            {/* Employees Table Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 font-semibold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                                <th className="py-3.5 pl-4">
                                    <div className="min-w-50 text-left">Employee</div>
                                </th>
                                <th className="py-3.5">
                                    <div className="min-w-50 text-center">Contact & Shift</div>
                                </th>
                                <th className="py-3.5">
                                    <div className="min-w-50 text-center">Working Hours</div>
                                </th>
                                <th className="py-3.5">
                                    <div className="min-w-50 text-center">Status</div>
                                </th>
                                <th className="py-3.5">
                                    <div className="min-w-50 text-center">Device Binding</div>
                                </th>
                                <th className="py-3.5 pr-4 text-right">
                                    <div className="min-w-50 text-right">Actions</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {employees.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <Users className="mx-auto mb-2 h-10 w-10 text-slate-300 dark:text-slate-700" />
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No employees found.</p>
                                        <p className="mt-1 text-xs text-slate-400">Add a new employee to get started.</p>
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map((emp) => (
                                    <tr key={emp.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="py-3.5 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 text-xs font-bold text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-400">
                                                    {emp.image ? (
                                                        <img src={`/storage/${emp.image}`} alt={emp.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        emp.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{emp.name}</p>
                                                    <p className="font-mono text-[11px] text-slate-400">
                                                        {emp.uid} &bull;{' '}
                                                        <span className="font-sans font-medium text-slate-600 dark:text-slate-300">{emp.role}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3.5">
                                            <div className="min-w-50 text-center">
                                                <p className="font-medium text-slate-700 dark:text-slate-300">{emp.phone}</p>
                                                <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                                                    {emp.check_in_time.substring(0, 5)} - {emp.check_out_time.substring(0, 5)}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="py-3.5">
                                            <div className="min-w-50 text-center">
                                                <p className="font-semibold text-slate-900 dark:text-white">{emp.working_hours} hrs/day</p>
                                                <p className="text-[11px] text-slate-400">Salary: ${Number(emp.salary).toLocaleString()}</p>
                                            </div>
                                        </td>

                                        <td className="py-3.5">
                                            <div className="min-w-50 text-center">
                                                {emp.status === 1 ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Active & Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Pending Verification
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-3.5 text-slate-500">
                                            <div className="min-w-50 text-center">
                                                {emp.status === 1 ? (
                                                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                                        Device active until{' '}
                                                        <span className="font-medium text-slate-900 dark:text-white">
                                                            {emp.device_token_expires_at
                                                                ? new Date(emp.device_token_expires_at).toLocaleDateString()
                                                                : 'N/A'}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => copyLink(emp.verification_token)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                        Copy Verification Link
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-3.5 pr-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Copy link button if pending */}
                                                {emp.status === 0 && (
                                                    <button
                                                        onClick={() => copyLink(emp.verification_token)}
                                                        title="Copy Verification Link"
                                                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                )}

                                                {/* Re-verify device button */}
                                                <button
                                                    onClick={() => handleReverify(emp)}
                                                    title="Re-verify / Change Device"
                                                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                </button>

                                                {/* View Details */}
                                                <button
                                                    onClick={() => openView(emp)}
                                                    title="View Full Profile"
                                                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEdit(emp)}
                                                    title="Edit Employee"
                                                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(emp)}
                                                    title="Delete Employee"
                                                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {employees.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800">
                        <span>
                            Page {employees.current_page} of {employees.last_page} ({employees.total} employees)
                        </span>
                        <div className="flex items-center gap-1">
                            {employees.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    disabled={!link.url || link.active}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-lg px-3 py-1 text-xs font-medium ${
                                        link.active
                                            ? 'bg-indigo-600 font-bold text-white'
                                            : link.url
                                              ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                              : 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Employee Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="my-8 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Register New Employee</h4>
                                <p className="text-xs text-slate-400">A single-use verification link will be created for device binding.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setCreateModalOpen(false);
                                    createForm.reset();
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Jane Doe"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    {createForm.errors.name && <p className="mt-1 text-xs text-rose-500">{createForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.phone}
                                        onChange={(e) => createForm.setData('phone', e.target.value)}
                                        placeholder="+1 555-0192"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    {createForm.errors.phone && <p className="mt-1 text-xs text-rose-500">{createForm.errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Role / Job Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.role}
                                        onChange={(e) => createForm.setData('role', e.target.value)}
                                        placeholder="Senior Developer"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    {createForm.errors.role && <p className="mt-1 text-xs text-rose-500">{createForm.errors.role}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Monthly Salary ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={createForm.data.salary}
                                        onChange={(e) => createForm.setData('salary', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Daily Working Hours *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        required
                                        value={createForm.data.working_hours}
                                        onChange={(e) => createForm.setData('working_hours', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Joining Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={createForm.data.joining_date}
                                        onChange={(e) => createForm.setData('joining_date', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Check In Time (Shift Start)
                                    </label>
                                    <input
                                        type="time"
                                        value={createForm.data.check_in_time}
                                        onChange={(e) => createForm.setData('check_in_time', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    <span className="text-[11px] text-slate-400">Defaults to office starting time</span>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Check Out Time (Shift End)
                                    </label>
                                    <input
                                        type="time"
                                        value={createForm.data.check_out_time}
                                        onChange={(e) => createForm.setData('check_out_time', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                    <span className="text-[11px] text-slate-400">Defaults to office closing time</span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Work Description</label>
                                <textarea
                                    rows={2}
                                    value={createForm.data.work_desc}
                                    onChange={(e) => createForm.setData('work_desc', e.target.value)}
                                    placeholder="Employee responsibilities and department details..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                                <ImageUploadPreview
                                    id="create-employee-photo"
                                    label="Employee Photo (Optional)"
                                    selectedFile={createForm.data.image}
                                    onFileChange={(file) => createForm.setData('image', file)}
                                    accept="image/*,.jpeg,.jpg,.png,.webp,.gif,.svg"
                                    aspectRatio="circle"
                                    helperText="JPG, PNG, WEBP (Max 4MB)"
                                    error={createForm.errors.image}
                                />

                                <FileUploadPreview
                                    id="create-employee-letter"
                                    label="Appointment Letter (PDF, Optional)"
                                    selectedFile={createForm.data.appointment_letter}
                                    onFileChange={(file) => createForm.setData('appointment_letter', file)}
                                    accept=".pdf,application/pdf"
                                    helperText="Max 10MB PDF"
                                    error={createForm.errors.appointment_letter}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreateModalOpen(false);
                                        createForm.reset();
                                    }}
                                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
                                >
                                    {createForm.processing ? 'Registering...' : 'Register & Generate Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {editModalOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="my-8 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Edit Employee Profile</h4>
                                <p className="text-xs text-slate-400">UID: {selectedEmployee.uid}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditModalOpen(false);
                                    editForm.reset();
                                    setSelectedEmployee(null);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.phone}
                                        onChange={(e) => editForm.setData('phone', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Role / Job Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.role}
                                        onChange={(e) => editForm.setData('role', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Monthly Salary ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editForm.data.salary}
                                        onChange={(e) => editForm.setData('salary', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Check In Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={editForm.data.check_in_time}
                                        onChange={(e) => editForm.setData('check_in_time', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Check Out Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={editForm.data.check_out_time}
                                        onChange={(e) => editForm.setData('check_out_time', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Work Description</label>
                                <textarea
                                    rows={2}
                                    value={editForm.data.work_desc}
                                    onChange={(e) => editForm.setData('work_desc', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                                <ImageUploadPreview
                                    id="edit-employee-photo"
                                    label="Replace Photo (Optional)"
                                    currentImageUrl={selectedEmployee?.image ? `/storage/${selectedEmployee.image}` : null}
                                    selectedFile={editForm.data.image}
                                    onFileChange={(file) => editForm.setData('image', file)}
                                    accept="image/*,.jpeg,.jpg,.png,.webp,.gif,.svg"
                                    aspectRatio="circle"
                                    helperText="JPG, PNG, WEBP (Max 4MB)"
                                    error={editForm.errors.image}
                                />

                                <FileUploadPreview
                                    id="edit-employee-letter"
                                    label="Replace Appointment Letter (PDF, Optional)"
                                    currentFileUrl={selectedEmployee?.appointment_letter ? `/storage/${selectedEmployee.appointment_letter}` : null}
                                    currentFileName={selectedEmployee ? `${selectedEmployee.name}_appointment.pdf` : 'Appointment Letter'}
                                    selectedFile={editForm.data.appointment_letter}
                                    onFileChange={(file) => editForm.setData('appointment_letter', file)}
                                    accept=".pdf,application/pdf"
                                    helperText="Max 10MB PDF"
                                    error={editForm.errors.appointment_letter}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditModalOpen(false);
                                        editForm.reset();
                                        setSelectedEmployee(null);
                                    }}
                                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
                                >
                                    {editForm.processing ? 'Saving...' : 'Update Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Employee Details Modal */}
            {viewModalOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Employee Profile Card</h4>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50 text-lg font-bold text-indigo-600 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    {selectedEmployee.image ? (
                                        <img
                                            src={`/storage/${selectedEmployee.image}`}
                                            alt={selectedEmployee.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        selectedEmployee.name.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg leading-tight font-bold text-slate-900 dark:text-white">{selectedEmployee.name}</h3>
                                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{selectedEmployee.role}</p>
                                    <p className="mt-0.5 font-mono text-xs text-slate-400">ID: {selectedEmployee.uid}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-800/50">
                                <div>
                                    <span className="mb-0.5 block text-slate-400">Phone:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedEmployee.phone}</span>
                                </div>
                                <div>
                                    <span className="mb-0.5 block text-slate-400">Joining Date:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedEmployee.joining_date}</span>
                                </div>
                                <div>
                                    <span className="mb-0.5 block text-slate-400">Shift Schedule:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {selectedEmployee.check_in_time.substring(0, 5)} - {selectedEmployee.check_out_time.substring(0, 5)}
                                    </span>
                                </div>
                                <div>
                                    <span className="mb-0.5 block text-slate-400">Hours & Salary:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {selectedEmployee.working_hours} hrs/day (${Number(selectedEmployee.salary).toLocaleString()})
                                    </span>
                                </div>
                            </div>

                            {selectedEmployee.work_desc && (
                                <div>
                                    <span className="mb-1 block text-xs font-semibold text-slate-400">Work Description:</span>
                                    <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800/30 dark:text-slate-300">
                                        {selectedEmployee.work_desc}
                                    </p>
                                </div>
                            )}

                            {selectedEmployee.appointment_letter ? (
                                <a
                                    href={`/storage/${selectedEmployee.appointment_letter}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100/50 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300"
                                >
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-indigo-500" />
                                        Download Appointment Letter (PDF)
                                    </span>
                                    <span>&rarr;</span>
                                </a>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No appointment letter uploaded.</p>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setViewModalOpen(false)}
                                    className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
