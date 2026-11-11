<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AttendanceExportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Display Monthly Attendance Report filtered by month, year, search, and outlet for authenticated store.
     */
    public function index(Request $request): Response
    {
        $admin = Auth::guard('admin')->user();

        $month = (int) $request->query('month', Carbon::now()->month);
        $year = (int) $request->query('year', Carbon::now()->year);
        $search = $request->query('search');
        $activeOutletId = $request->query('outlet_id', 'all');

        $outlets = $admin->outlets()->withCount('employees')->orderBy('name')->get();

        $query = $admin->employees()->with('outlet')->orderBy('name');

        if ($activeOutletId !== 'all' && ! empty($activeOutletId)) {
            $query->where('outlet_id', (int) $activeOutletId);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%");
            });
        }

        $employees = $query->get();

        // Calculate start and end date of the month
        $startOfMonthCarbon = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endOfMonthCarbon = Carbon::createFromDate($year, $month, 1)->endOfMonth();
        $startOfMonth = $startOfMonthCarbon->toDateString();
        $endOfMonth = $endOfMonthCarbon->toDateString();
        $daysInMonth = $startOfMonthCarbon->daysInMonth;

        // Load attendances for the given month (and active outlet if specified)
        $attendancesQuery = $admin->attendances()->whereBetween('date', [$startOfMonth, $endOfMonth]);
        if ($activeOutletId !== 'all' && ! empty($activeOutletId)) {
            $attendancesQuery->where('outlet_id', (int) $activeOutletId);
        }
        $attendances = $attendancesQuery->get()->groupBy('employee_id');

        $reportData = $employees->map(function ($employee) use ($attendances, $year, $month, $daysInMonth) {
            $records = $attendances->get($employee->id, collect());

            $presentDays = $records->count();
            $lateRecords = $records->where('late_minutes', '>', 0);
            $earlyRecords = $records->where('early_leave_minutes', '>', 0);
            $overtimeRecords = $records->where('overtime_minutes', '>', 0);

            // Calculate actual worked minutes from check_in/check_out timestamps
            $actualWorkedMinutes = 0;
            foreach ($records as $record) {
                if ($record->check_in_at && $record->check_out_at) {
                    $checkIn = Carbon::parse($record->check_in_at);
                    $checkOut = Carbon::parse($record->check_out_at);
                    $actualWorkedMinutes += max(0, $checkIn->diffInMinutes($checkOut));
                }
            }

            // Employee's weekly working days (e.g. ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'])
            $employeeWorkingDays = $employee->working_days;
            if (empty($employeeWorkingDays) || ! is_array($employeeWorkingDays)) {
                $employeeWorkingDays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'];
            }
            $employeeWorkingDays = array_map('strtolower', $employeeWorkingDays);

            // Count scheduled work days in this month excluding employee's weekends
            $scheduledWorkDays = 0;
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $dateObj = Carbon::createFromDate($year, $month, $d);
                $dayShort = strtolower($dateObj->format('D'));
                if (in_array($dayShort, $employeeWorkingDays, true)) {
                    $scheduledWorkDays++;
                }
            }

            $workingHoursPerDay = (float) ($employee->working_hours ?? 8);
            // Scheduled total working minutes for the month (excluding weekends)
            $scheduledWorkedMinutes = (int) round($scheduledWorkDays * $workingHoursPerDay * 60);

            return [
                'id' => $employee->id,
                'uid' => $employee->uid,
                'name' => $employee->name,
                'role' => $employee->role,
                'status' => $employee->status,
                'outlet' => $employee->outlet ? [
                    'id' => $employee->outlet->id,
                    'name' => $employee->outlet->name,
                    'uid' => $employee->outlet->uid,
                ] : null,
                'present_days' => $presentDays,
                'scheduled_work_days' => $scheduledWorkDays,
                'late_count' => $lateRecords->count(),
                'late_total_minutes' => (int) $lateRecords->sum('late_minutes'),
                'early_leave_count' => $earlyRecords->count(),
                'early_leave_total_minutes' => (int) $earlyRecords->sum('early_leave_minutes'),
                'overtime_count' => $overtimeRecords->count(),
                'overtime_total_minutes' => (int) $overtimeRecords->sum('overtime_minutes'),
                'actual_worked_minutes' => $actualWorkedMinutes,
                'scheduled_worked_minutes' => $scheduledWorkedMinutes,
                'working_hours_per_day' => $workingHoursPerDay,
                'working_days' => $employeeWorkingDays,
            ];
        });

        return Inertia::render('admin/reports/index', [
            'reports' => $reportData,
            'outlets' => $outlets,
            'activeOutletId' => $activeOutletId,
            'filters' => [
                'month' => $month,
                'year' => $year,
                'search' => $search ?? '',
                'outlet_id' => $activeOutletId,
            ],
            'allEmployees' => $employees->map->only('id', 'name', 'uid'),
        ]);
    }

    /**
     * Export attendance to Excel with outlet filter support.
     */
    public function export(Request $request, AttendanceExportService $exportService): StreamedResponse
    {
        $admin = Auth::guard('admin')->user();
        $employeeId = $request->query('employee_id') ? (int) $request->query('employee_id') : null;
        $outletId = $request->query('outlet_id') && $request->query('outlet_id') !== 'all' ? (int) $request->query('outlet_id') : null;
        $month = (int) $request->query('month', Carbon::now()->month);
        $year = (int) $request->query('year', Carbon::now()->year);

        return $exportService->exportToExcel($employeeId, $outletId, $admin->id, $month, $year);
    }
}
