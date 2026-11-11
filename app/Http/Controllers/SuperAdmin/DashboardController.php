<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Attendance;
use App\Models\ContactInquiry;
use App\Models\Employee;
use App\Models\Outlet;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display Super Admin Dashboard with Multi-Store & Storage Analytics.
     */
    public function index(): Response
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

        // Calculate store storage breakdown
        $stores = Admin::withCount(['outlets', 'employees'])->orderBy('created_at', 'desc')->get();

        $totalStorageBytes = 0;
        $storesData = $stores->map(function ($store) use (&$totalStorageBytes) {
            $bytes = $store->getTotalStorageBytes();
            $totalStorageBytes += $bytes;

            return [
                'id' => $store->id,
                'uid' => $store->uid,
                'store_id' => $store->store_id,
                'name' => $store->name,
                'email' => $store->email,
                'max_outlets' => $store->max_outlets,
                'outlets_count' => $store->outlets_count,
                'employees_count' => $store->employees_count,
                'storage_bytes' => $bytes,
                'storage_formatted' => $store->formatted_storage,
                'two_factor_enabled' => (bool) $store->two_factor_enabled,
                'created_at' => $store->created_at?->toFormattedDateString(),
            ];
        });

        // Format total platform storage
        $formattedPlatformStorage = '0 B';
        if ($totalStorageBytes < 1024) {
            $formattedPlatformStorage = $totalStorageBytes . ' B';
        } elseif ($totalStorageBytes < 1048576) {
            $formattedPlatformStorage = round($totalStorageBytes / 1024, 2) . ' KB';
        } elseif ($totalStorageBytes < 1073741824) {
            $formattedPlatformStorage = round($totalStorageBytes / 1048576, 2) . ' MB';
        } else {
            $formattedPlatformStorage = round($totalStorageBytes / 1073741824, 2) . ' GB';
        }

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
                'total_storage_bytes' => $totalStorageBytes,
                'total_storage_formatted' => $formattedPlatformStorage,
            ],
            'stores' => $storesData,
            'recentInquiries' => $recentInquiries,
        ]);
    }
}

