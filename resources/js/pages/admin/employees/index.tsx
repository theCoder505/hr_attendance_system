import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Users,
    UserPlus,
    Search,
    Copy,
    RefreshCw,
    Edit3,
    Trash2,
    Eye,
    FileText,
    CheckCircle2,
    Clock,
    X,
    Upload,
    Calendar,
    DollarSign,
    Briefcase,
    Phone,
} from 'lucide-react';
import { showConfirm, showSuccess, showError, showToast } from '@/lib/swal';
import Swal from 'sweetalert2';
import ImageUploadPreview from '@/components/image-upload-preview';
import FileUploadPreview from '@/components/file-upload-preview';

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
        router.get(
            '/administration-control/employees',
            { search: searchVal, status: statusVal },
            { preserveState: true }
        );
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
            'Yes, reset device'
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
            'Yes, delete employee'
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-1 items-center gap-3 max-w-lg">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, UID, role, phone..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                handleFilter(e.target.value, statusFilter);
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            handleFilter(searchTerm, e.target.value);
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="">All Statuses</option>
                        <option value="1">Verified / Active</option>
                        <option value="0">Pending Verification</option>
                    </select>
                </div>

                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                    <UserPlus className="h-4 w-4" />
                    Register New Employee
                </button>
            </div>

            {/* Employees Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                                <th className="py-3.5 pl-4">Employee</th>
                                <th className="py-3.5">Contact & Shift</th>
                                <th className="py-3.5">Working Hours</th>
                                <th className="py-3.5">Status</th>
                                <th className="py-3.5">Device Binding</th>
                                <th className="py-3.5 text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {employees.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No employees found.</p>
                                        <p className="text-xs text-slate-400 mt-1">Add a new employee to get started.</p>
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0 overflow-hidden">
                                                    {emp.image ? (
                                                        <img src={`/storage/${emp.image}`} alt={emp.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        emp.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                        {emp.name}
                                                    </p>
                                                    <p className="text-slate-400 text-[11px] font-mono">
                                                        {emp.uid} &bull; <span className="text-slate-600 dark:text-slate-300 font-sans font-medium">{emp.role}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-3.5">
                                            <p className="text-slate-700 dark:text-slate-300 font-medium">
                                                {emp.phone}
                                            </p>
                                            <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                                                {emp.check_in_time.substring(0, 5)} - {emp.check_out_time.substring(0, 5)}
                                            </p>
                                        </td>

                                        <td className="py-3.5">
                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                {emp.working_hours} hrs/day
                                            </p>
                                            <p className="text-slate-400 text-[11px]">
                                                Salary: ${Number(emp.salary).toLocaleString()}
                                            </p>
                                        </td>

                                        <td className="py-3.5">
                                            {emp.status === 1 ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Active & Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Pending Verification
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3.5 text-slate-500">
                                            {emp.status === 1 ? (
                                                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                                    Device active until{' '}
                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                        {emp.device_token_expires_at ? new Date(emp.device_token_expires_at).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => copyLink(emp.verification_token)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                    Copy Verification Link
                                                </button>
                                            )}
                                        </td>

                                        <td className="py-3.5 text-right pr-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Copy link button if pending */}
                                                {emp.status === 0 && (
                                                    <button
                                                        onClick={() => copyLink(emp.verification_token)}
                                                        title="Copy Verification Link"
                                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                )}

                                                {/* Re-verify device button */}
                                                <button
                                                    onClick={() => handleReverify(emp)}
                                                    title="Re-verify / Change Device"
                                                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                </button>

                                                {/* View Details */}
                                                <button
                                                    onClick={() => openView(emp)}
                                                    title="View Full Profile"
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => openEdit(emp)}
                                                    title="Edit Employee"
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(emp)}
                                                    title="Delete Employee"
                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
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
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
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
                                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                        link.active
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : link.url
                                            ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Employee Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                    Register New Employee
                                </h4>
                                <p className="text-xs text-slate-400">
                                    A single-use verification link will be created for device binding.
                                </p>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="Jane Doe"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    {createForm.errors.name && <p className="text-rose-500 text-xs mt-1">{createForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.phone}
                                        onChange={(e) => createForm.setData('phone', e.target.value)}
                                        placeholder="+1 555-0192"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    {createForm.errors.phone && <p className="text-rose-500 text-xs mt-1">{createForm.errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Role / Job Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.data.role}
                                        onChange={(e) => createForm.setData('role', e.target.value)}
                                        placeholder="Senior Developer"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    {createForm.errors.role && <p className="text-rose-500 text-xs mt-1">{createForm.errors.role}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Monthly Salary ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={createForm.data.salary}
                                        onChange={(e) => createForm.setData('salary', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Daily Working Hours *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        required
                                        value={createForm.data.working_hours}
                                        onChange={(e) => createForm.setData('working_hours', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Joining Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={createForm.data.joining_date}
                                        onChange={(e) => createForm.setData('joining_date', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Check In Time (Shift Start)
                                    </label>
                                    <input
                                        type="time"
                                        value={createForm.data.check_in_time}
                                        onChange={(e) => createForm.setData('check_in_time', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <span className="text-[11px] text-slate-400">Defaults to office starting time</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Check Out Time (Shift End)
                                    </label>
                                    <input
                                        type="time"
                                        value={createForm.data.check_out_time}
                                        onChange={(e) => createForm.setData('check_out_time', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <span className="text-[11px] text-slate-400">Defaults to office closing time</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Work Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={createForm.data.work_desc}
                                    onChange={(e) => createForm.setData('work_desc', e.target.value)}
                                    placeholder="Employee responsibilities and department details..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreateModalOpen(false);
                                        createForm.reset();
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                    Edit Employee Profile
                                </h4>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.phone}
                                        onChange={(e) => editForm.setData('phone', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Role / Job Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.data.role}
                                        onChange={(e) => editForm.setData('role', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Monthly Salary ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editForm.data.salary}
                                        onChange={(e) => editForm.setData('salary', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Check In Time
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={editForm.data.check_in_time}
                                        onChange={(e) => editForm.setData('check_in_time', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Check Out Time
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={editForm.data.check_out_time}
                                        onChange={(e) => editForm.setData('check_out_time', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Work Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={editForm.data.work_desc}
                                    onChange={(e) => editForm.setData('work_desc', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditModalOpen(false);
                                        editForm.reset();
                                        setSelectedEmployee(null);
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">
                                Employee Profile Card
                            </h4>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg shrink-0 overflow-hidden shadow-sm">
                                    {selectedEmployee.image ? (
                                        <img src={`/storage/${selectedEmployee.image}`} alt={selectedEmployee.name} className="h-full w-full object-cover" />
                                    ) : (
                                        selectedEmployee.name.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                                        {selectedEmployee.name}
                                    </h3>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                        {selectedEmployee.role}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                                        ID: {selectedEmployee.uid}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Phone:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedEmployee.phone}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Joining Date:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedEmployee.joining_date}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Shift Schedule:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {selectedEmployee.check_in_time.substring(0, 5)} - {selectedEmployee.check_out_time.substring(0, 5)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Hours & Salary:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {selectedEmployee.working_hours} hrs/day (${Number(selectedEmployee.salary).toLocaleString()})
                                    </span>
                                </div>
                            </div>

                            {selectedEmployee.work_desc && (
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 block mb-1">Work Description:</span>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl">
                                        {selectedEmployee.work_desc}
                                    </p>
                                </div>
                            )}

                            {selectedEmployee.appointment_letter ? (
                                <a
                                    href={`/storage/${selectedEmployee.appointment_letter}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100/50 transition-colors"
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

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={() => setViewModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
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
