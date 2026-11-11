<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\WebsiteSetting;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendancePageController extends Controller
{
    /**
     * Render the employee attendance public portal page.
     */
    public function index(Request $request): Response
    {
        $settings = WebsiteSetting::current();

        return Inertia::render('attendance/index', [
            'brandname' => $settings->brandname ?? 'AttendEase',
            'logo' => $settings->logo,
            'officeStartingTime' => $settings->office_starting_time,
            'officeClosingTime' => $settings->office_closing_time,
            'clientIp' => $request->ip(),
            'timezone' => config('app.timezone', 'Asia/Dhaka'),
            'serverTime' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * Display the dedicated Service Suspended page for employees.
     * If the store is not suspended (or no suspended store matches), automatically redirect to the index page.
     */
    public function suspended(Request $request): Response|RedirectResponse
    {
        $settings = WebsiteSetting::current();
        $storeId = $request->query('store_id');
        $store = $storeId ? Admin::where('store_id', $storeId)->first() : null;

        // If no store is specified or the store is NOT suspended, redirect back to attendance index
        if (! $store || ! $store->isSuspended()) {
            return redirect()->route('attendance.index');
        }

        return Inertia::render('attendance/suspended', [
            'brandname' => $settings->brandname ?? 'AttendEase',
            'logo' => $settings->logo,
            'storeName' => $store->name,
            'storeId' => $store->store_id,
        ]);
    }

    /**
     * Get real-time status of employee device, current day attendance, and month stats.
     */
    public function status(Request $request, AttendanceService $attendanceService): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $activeAttendance = $attendanceService->getActiveAttendance($employee);

        $today = Carbon::today()->toDateString();
        $todayRecord = Attendance::where('employee_id', $employee->id)->where('date', $today)->first();

        // State check:
        // canCheckIn: true if no attendance record for today AND no overnight active attendance
        $canCheckIn = (! $todayRecord) && (! $activeAttendance);

        // canCheckOut: true if there is an active attendance where check_out_at is null
        $canCheckOut = ($activeAttendance && $activeAttendance->check_out_at === null);

        // Monthly stats
        $month = Carbon::now()->month;
        $year = Carbon::now()->year;
        $monthlyStats = $attendanceService->getMonthlyStats($employee->id, $year, $month);

        $employee->loadMissing(['outlet', 'admin']);

        return response()->json([
            'success' => true,
            'employee' => [
                'id' => $employee->id,
                'uid' => $employee->uid,
                'name' => $employee->name,
                'role' => $employee->role,
                'image' => $employee->image,
                'store_id' => $employee->admin?->store_id ?? $employee->admin?->uid,
                'store_name' => $employee->admin?->name,
                'outlet_id' => $employee->outlet_id,
                'outlet' => $employee->outlet ? [
                    'id' => $employee->outlet->id,
                    'uid' => $employee->outlet->uid,
                    'name' => $employee->outlet->name,
                    'wifi_ip' => $employee->outlet->wifi_ip,
                ] : null,
                'check_in_time' => $employee->check_in_time,
                'check_out_time' => $employee->check_out_time,
                'working_hours' => $employee->working_hours,
                'device_token_expires_at' => $employee->device_token_expires_at?->toFormattedDateString(),
            ],
            'store_id' => $employee->admin?->store_id ?? $employee->admin?->uid,
            'outlet_uid' => $employee->outlet?->uid ?? null,
            'attendance' => $activeAttendance,
            'todayRecord' => $todayRecord,
            'canCheckIn' => $canCheckIn,
            'canCheckOut' => $canCheckOut,
            'monthlyStats' => $monthlyStats,
            'currentTime' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * Handle employee check in.
     */
    public function checkIn(Request $request, AttendanceService $attendanceService): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $result = $attendanceService->checkIn($employee);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Handle employee check out.
     */
    public function checkOut(Request $request, AttendanceService $attendanceService): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $result = $attendanceService->checkOut($employee);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Get attendance history for the verified employee.
     */
    public function history(Request $request): JsonResponse
    {
        /** @var Employee $employee */
        $employee = $request->attributes->get('employee');

        $month = (int) $request->query('month', Carbon::now()->month);
        $year = (int) $request->query('year', Carbon::now()->year);

        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
        $endOfMonth = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

        $records = Attendance::where('employee_id', $employee->id)
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'records' => $records,
            'month' => $month,
            'year' => $year,
        ]);
    }
}
