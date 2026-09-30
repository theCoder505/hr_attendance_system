<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\WebsiteSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Admin Dashboard with Calendar & Attendance details for selected date.
     */
    public function index(Request $request): Response
    {
        $selectedDate = $request->query('date', Carbon::today()->toDateString());
        $carbonDate = Carbon::parse($selectedDate);

        $month = (int) $request->query('month', $carbonDate->month);
        $year = (int) $request->query('year', $carbonDate->year);

        // Fetch all active employees
        $allEmployees = Employee::orderBy('name')->get();
        $totalEmployeesCount = $allEmployees->where('status', 1)->count();

        // Attendances for the selected date
        $attendances = Attendance::with('employee')
            ->where('date', $selectedDate)
            ->get();

        // Calculate metrics for selected date
        $presentCount = $attendances->count();
        $lateCount = $attendances->where('late_minutes', '>', 0)->count();
        $earlyLeaveCount = $attendances->where('early_leave_minutes', '>', 0)->count();
        $overtimeCount = $attendances->where('overtime_minutes', '>', 0)->count();
        $absentCount = max(0, $totalEmployeesCount - $presentCount);

        // Employees not yet recorded on this date (for manual add dialog)
        $recordedEmployeeIds = $attendances->pluck('employee_id')->toArray();
        $availableEmployees = $allEmployees->filter(function ($emp) use ($recordedEmployeeIds) {
            return ! in_array($emp->id, $recordedEmployeeIds, true) && $emp->status === 1;
        })->values();

        // Monthly calendar aggregates: count of present/late per day in selected month
        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        $monthlyAttendances = Attendance::whereBetween('date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->get()
            ->groupBy(function ($item) {
                return Carbon::parse($item->date)->toDateString();
            });

        $calendarDays = [];
        $cursor = $startOfMonth->copy();
        while ($cursor->lte($endOfMonth)) {
            $dateStr = $cursor->toDateString();
            $dayRecords = $monthlyAttendances->get($dateStr, collect());
            $calendarDays[$dateStr] = [
                'date' => $dateStr,
                'day' => $cursor->day,
                'total_present' => $dayRecords->count(),
                'total_late' => $dayRecords->where('late_minutes', '>', 0)->count(),
                'total_early' => $dayRecords->where('early_leave_minutes', '>', 0)->count(),
                'total_overtime' => $dayRecords->where('overtime_minutes', '>', 0)->count(),
            ];
            $cursor->addDay();
        }

        $settings = WebsiteSetting::current();

        return Inertia::render('admin/dashboard/index', [
            'selectedDate' => $selectedDate,
            'currentMonth' => $month,
            'currentYear' => $year,
            'metrics' => [
                'total_employees' => $totalEmployeesCount,
                'present' => $presentCount,
                'late' => $lateCount,
                'early_leave' => $earlyLeaveCount,
                'overtime' => $overtimeCount,
                'absent' => $absentCount,
            ],
            'attendances' => $attendances,
            'availableEmployees' => $availableEmployees,
            'calendarDays' => $calendarDays,
            'settings' => $settings,
        ]);
    }
}
