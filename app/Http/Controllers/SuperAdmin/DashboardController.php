<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Attendance;
use App\Models\ContactInquiry;
use App\Models\Employee;
use App\Models\Outlet;
use App\Services\StorageCalculatorService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display Super Admin Dashboard with Multi-Store & Storage Analytics.
     */
    public function index(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();

        $totalStores = Admin::count();
        $totalOutlets = Outlet::count();
        $totalEmployees = Employee::count();
        $attendancesToday = Attendance::where('date', $today)->count();
        $attendancesThisMonth = Attendance::whereBetween('date', [$startOfMonth, $endOfMonth])->count();
        $pendingInquiriesCount = ContactInquiry::where('status', 'pending')->count();

        // Detailed Platform Storage Breakdown (Users Data + System Data + Total Platform)
        // Set refresh_storage=1 to force recalculate total website files on disk
        $storageAnalytics = StorageCalculatorService::getPlatformStorageDetails($request->boolean('refresh_storage'));

        // Calculate store storage breakdown
        $stores = Admin::withCount(['outlets', 'employees'])->orderBy('created_at', 'desc')->get();

        $storesData = $stores->map(function ($store) {
            $details = StorageCalculatorService::getStoreStorageDetails($store);

            return [
                'id' => $store->id,
                'uid' => $store->uid,
                'store_id' => $store->store_id,
                'name' => $store->name,
                'email' => $store->email,
                'max_outlets' => $store->max_outlets,
                'max_employees_per_outlet' => (int) ($store->max_employees_per_outlet ?: 25),
                'max_storage_mb' => $details['max_storage_mb'],
                'max_storage_formatted' => $details['max_storage_formatted'],
                'storage_used_percentage' => $details['used_percentage'],
                'outlets_count' => $store->outlets_count,
                'employees_count' => $store->employees_count,
                'storage_bytes' => $details['total_bytes'],
                'storage_formatted' => $details['total_formatted'],
                'storage_breakdown' => [
                    'media_formatted' => $details['media_formatted'],
                    'attendance_formatted' => $details['attendance_formatted'],
                    'db_formatted' => $details['db_formatted'],
                ],
                'two_factor_enabled' => (bool) $store->two_factor_enabled,
                'created_at' => $store->created_at?->toFormattedDateString(),
            ];
        });

        // Recent Contact Inquiries
        $recentInquiries = ContactInquiry::orderBy('created_at', 'desc')->take(5)->get();

        return Inertia::render('super-admin/dashboard/index', [
            'metrics' => [
                'total_stores' => $totalStores,
                'total_outlets' => $totalOutlets,
                'total_employees' => $totalEmployees,
                'attendances_today' => $attendancesToday,
                'attendances_this_month' => $attendancesThisMonth,
                'pending_inquiries' => $pendingInquiriesCount,
                'total_storage_bytes' => $storageAnalytics['platform_total']['total_bytes'],
                'total_storage_formatted' => $storageAnalytics['platform_total']['total_formatted'],
            ],
            'storage_analytics' => $storageAnalytics,
            'stores' => $storesData,
            'recentInquiries' => $recentInquiries,
        ]);
    }
}

