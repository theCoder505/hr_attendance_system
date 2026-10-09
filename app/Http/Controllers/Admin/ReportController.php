<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Outlet;
use App\Services\AttendanceExportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Display Monthly Attendance Report filtered by month, year, search, and outlet.
     */
    public function index(Request $request): Response
    {
        $month = (int) $request->query('month', Carbon::now()->month);
        $year = (int) $request->query('year', Carbon::now()->year);
        $search = $request->query('search');
        $activeOutletId = $request->query('outlet_id', 'all');

        $outlets = Outlet::withCount('employees')->orderBy('name')->get();

        $query = Employee::with('outlet')->orderBy('name');

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
        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
        $endOfMonth = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

        // Load attendances for the given month (and active outlet if specified)
        $attendancesQuery = Attendance::whereBetween('date', [$startOfMonth, $endOfMonth]);
        if ($activeOutletId !== 'all' && ! empty($activeOutletId)) {
            $attendancesQuery->where('outlet_id', (int) $activeOutletId);
        }
        $attendances = $attendancesQuery->get()->groupBy('employee_id');

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
                'outlet' => $employee->outlet ? [
                    'id' => $employee->outlet->id,
                    'name' => $employee->outlet->name,
                    'uid' => $employee->outlet->uid,
                ] : null,
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
        $employeeId = $request->query('employee_id') ? (int) $request->query('employee_id') : null;
        $outletId = $request->query('outlet_id') && $request->query('outlet_id') !== 'all' ? (int) $request->query('outlet_id') : null;

        return $exportService->exportToExcel($employeeId, $outletId);
    }
}
