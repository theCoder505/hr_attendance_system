<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAttendanceRequest;
use App\Http\Requests\Admin\UpdateAttendanceRequest;
use App\Models\Attendance;
use App\Models\Employee;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;

class AttendanceController extends Controller
{
    /**
     * Store a manual attendance record.
     */
    public function store(StoreAttendanceRequest $request, AttendanceService $attendanceService): RedirectResponse
    {
        $employee = Employee::findOrFail($request->employee_id);
        $date = $request->date;

        // Check if attendance already exists for this date and employee
        $exists = Attendance::where('employee_id', $employee->id)->where('date', $date)->exists();
        if ($exists) {
            return back()->with('error', 'An attendance record already exists for this employee on this date.');
        }

        $checkInAt = Carbon::parse($date . ' ' . $request->check_in_time);
        $checkOutAt = ! empty($request->check_out_time) ? Carbon::parse($date . ' ' . $request->check_out_time) : null;

        $metrics = $attendanceService->calculateMetrics($employee, $date, $checkInAt, $checkOutAt);

        Attendance::create([
            'employee_id' => $employee->id,
            'date' => $date,
            'check_in_at' => $checkInAt,
            'check_out_at' => $checkOutAt,
            'late_minutes' => $metrics['late_minutes'],
            'early_leave_minutes' => $metrics['early_leave_minutes'],
            'overtime_minutes' => $metrics['overtime_minutes'],
            'is_manual' => true,
        ]);

        return back()->with('success', 'Manual attendance record added successfully.');
    }

    /**
     * Update an attendance record.
     */
    public function update(UpdateAttendanceRequest $request, Attendance $attendance, AttendanceService $attendanceService): RedirectResponse
    {
        $employee = $attendance->employee;
        $date = Carbon::parse($attendance->date)->toDateString();

        $checkInAt = Carbon::parse($date . ' ' . $request->check_in_time);
        $checkOutAt = ! empty($request->check_out_time) ? Carbon::parse($date . ' ' . $request->check_out_time) : null;

        $metrics = $attendanceService->calculateMetrics($employee, $date, $checkInAt, $checkOutAt);

        $attendance->update([
            'check_in_at' => $checkInAt,
            'check_out_at' => $checkOutAt,
            'late_minutes' => $metrics['late_minutes'],
            'early_leave_minutes' => $metrics['early_leave_minutes'],
            'overtime_minutes' => $metrics['overtime_minutes'],
            'is_manual' => true,
        ]);

        return back()->with('success', 'Attendance record updated successfully.');
    }

    /**
     * Delete an attendance record.
     */
    public function destroy(Attendance $attendance): RedirectResponse
    {
        $attendance->delete();

        return back()->with('success', 'Attendance record deleted successfully.');
    }
}
