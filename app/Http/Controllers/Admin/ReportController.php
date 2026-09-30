<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\AttendanceExportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Display Monthly Attendance Report.
     */
    public function index(Request $request): Response
    {
        $month = (int) $request->query('month', Carbon::now()->month);
        $year = (int) $request->query('year', Carbon::now()->year);
        $search = $request->query('search');

        $query = Employee::query()->orderBy('name');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%");
            });
        }

        $employees = $query->get();

        // Calculate start and end date of the month
        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
        $endOfMonth = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

        // Load all attendances for the given month
        $attendances = Attendance::whereBetween('date', [$startOfMonth, $endOfMonth])
            ->get()
            ->groupBy('employee_id');

        $reportData = $employees->map(function ($employee) use ($attendances) {
            $records = $attendances->get($employee->id, collect());

            $presentDays = $records->count();
            $lateRecords = $records->where('late_minutes', '>', 0);
            $earlyRecords = $records->where('early_leave_minutes', '>', 0);
            $overtimeRecords = $records->where('overtime_minutes', '>', 0);

            return [
                'id' => $employee->id,
                'uid' => $employee->uid,
                'name' => $employee->name,
                'role' => $employee->role,
                'status' => $employee->status,
                'present_days' => $presentDays,
                'late_count' => $lateRecords->count(),
                'late_total_minutes' => (int) $lateRecords->sum('late_minutes'),
                'early_leave_count' => $earlyRecords->count(),
                'early_leave_total_minutes' => (int) $earlyRecords->sum('early_leave_minutes'),
                'overtime_count' => $overtimeRecords->count(),
                'overtime_total_minutes' => (int) $overtimeRecords->sum('overtime_minutes'),
            ];
        });

        return Inertia::render('admin/reports/index', [
            'reports' => $reportData,
            'filters' => [
                'month' => $month,
                'year' => $year,
                'search' => $search ?? '',
            ],
            'allEmployees' => $employees->map->only('id', 'name', 'uid'),
        ]);
    }

    /**
     * Export attendance to Excel.
     */
    public function export(Request $request, AttendanceExportService $exportService): StreamedResponse
    {
        $employeeId = $request->query('employee_id') ? (int) $request->query('employee_id') : null;

        return $exportService->exportToExcel($employeeId);
    }
}
