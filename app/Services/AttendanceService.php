<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\WebsiteSetting;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceService
{
    /**
     * Get the active/open attendance record for an employee.
     * Takes into account overnight shifts:
     * An open attendance (no check-out) stays checkable-out until the employee's
     * next check_in_time on the following day.
     */
    public function getActiveAttendance(Employee $employee): ?Attendance
    {
        $this->autoCloseExpiredAttendancesForEmployee($employee);

        $today = Carbon::today()->toDateString();

        // 1. Check if there is an attendance for today
        $todayAttendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if ($todayAttendance) {
            return $todayAttendance;
        }

        // 2. Check if there is an unclosed attendance from yesterday (overnight shift)
        $yesterday = Carbon::yesterday()->toDateString();
        $yesterdayAttendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $yesterday)
            ->whereNull('check_out_at')
            ->first();

        if ($yesterdayAttendance) {
            // Next check-in window begins at employee's check_in_time today
            $todayNextCheckin = Carbon::parse($today . ' ' . $employee->check_in_time);
            if (Carbon::now()->isBefore($todayNextCheckin)) {
                return $yesterdayAttendance;
            }
        }

        return null;
    }

    /**
     * Process Employee Check In.
     */
    public function checkIn(Employee $employee, ?Carbon $time = null): array
    {
        $time = $time ?? Carbon::now();
        $date = $time->toDateString();

        // Close any prior pending attendance records
        $this->autoCloseExpiredAttendancesForEmployee($employee);

        // Check if an attendance record already exists for today
        $existing = Attendance::where('employee_id', $employee->id)
            ->where('date', $date)
            ->first();

        if ($existing) {
            return [
                'success' => false,
                'message' => 'Attendance for today has already been recorded.',
                'attendance' => $existing,
            ];
        }

        // Calculate late minutes
        $scheduledCheckIn = Carbon::parse($date . ' ' . $employee->check_in_time);
        $lateMinutes = 0;
        if ($time->isAfter($scheduledCheckIn)) {
            $lateMinutes = (int) $scheduledCheckIn->diffInMinutes($time);
        }

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'date' => $date,
            'check_in_at' => $time,
            'check_out_at' => null,
            'late_minutes' => $lateMinutes,
            'overtime_minutes' => 0,
            'early_leave_minutes' => 0,
            'is_manual' => false,
        ]);

        // Session rule: each successful check-in extends device_token_expires_at by another month
        $employee->update([
            'device_token_expires_at' => Carbon::now()->addMonth(),
        ]);

        return [
            'success' => true,
            'message' => 'Checked in successfully' . ($lateMinutes > 0 ? " (Late by {$lateMinutes} min)" : '!'),
            'attendance' => $attendance,
        ];
    }

    /**
     * Process Employee Check Out.
     */
    public function checkOut(Employee $employee, ?Carbon $time = null): array
    {
        $time = $time ?? Carbon::now();

        $activeAttendance = $this->getActiveAttendance($employee);

        if (! $activeAttendance || $activeAttendance->check_out_at !== null) {
            return [
                'success' => false,
                'message' => 'No active open check-in found to check out.',
                'attendance' => null,
            ];
        }

        // Compute early leave and overtime relative to scheduled check-out
        $attDate = Carbon::parse($activeAttendance->date)->toDateString();
        $scheduledCheckOut = Carbon::parse($attDate . ' ' . $employee->check_out_time);

        // If checkout is overnight (e.g. checkin 20:00, checkout 04:00 next day)
        $scheduledCheckIn = Carbon::parse($attDate . ' ' . $employee->check_in_time);
        if ($scheduledCheckOut->isBefore($scheduledCheckIn)) {
            $scheduledCheckOut->addDay();
        }

        $earlyLeaveMinutes = 0;
        $overtimeMinutes = 0;

        if ($time->isBefore($scheduledCheckOut)) {
            $earlyLeaveMinutes = (int) $time->diffInMinutes($scheduledCheckOut);
        } elseif ($time->isAfter($scheduledCheckOut)) {
            $overtimeMinutes = (int) $scheduledCheckOut->diffInMinutes($time);
        }

        $activeAttendance->update([
            'check_out_at' => $time,
            'early_leave_minutes' => $earlyLeaveMinutes,
            'overtime_minutes' => $overtimeMinutes,
        ]);

        return [
            'success' => true,
            'message' => 'Checked out successfully' .
                ($earlyLeaveMinutes > 0 ? " (Early leave: {$earlyLeaveMinutes} min)" : '') .
                ($overtimeMinutes > 0 ? " (Overtime: {$overtimeMinutes} min)" : ''),
            'attendance' => $activeAttendance,
        ];
    }

    /**
     * Auto close any open attendance for this employee where next check-in window has arrived.
     */
    public function autoCloseExpiredAttendancesForEmployee(Employee $employee): void
    {
        $settings = WebsiteSetting::current();
        $penaltyMinutes = $settings->missing_checkout_early_leave_minutes ?? 60;
        $now = Carbon::now();

        $openAttendances = Attendance::where('employee_id', $employee->id)
            ->whereNull('check_out_at')
            ->where('date', '<', $now->toDateString())
            ->get();

        foreach ($openAttendances as $att) {
            // Next check-in window began at employee's check_in_time on the next calendar day
            $nextDayCheckin = Carbon::parse($att->date)->addDay()->setTimeFromTimeString($employee->check_in_time);

            if ($now->greaterThanOrEqualTo($nextDayCheckin)) {
                // Default virtual check-out as early leave with penalty
                $scheduledOut = Carbon::parse($att->date . ' ' . $employee->check_out_time);
                $att->update([
                    'check_out_at' => $scheduledOut->copy()->subMinutes($penaltyMinutes),
                    'early_leave_minutes' => $penaltyMinutes,
                    'overtime_minutes' => 0,
                ]);
            }
        }
    }

    /**
     * Auto-close all system-wide missing check-outs.
     * Can be invoked by scheduled command or periodic check.
     */
    public function autoCloseAllMissingCheckouts(): int
    {
        $settings = WebsiteSetting::current();
        $penaltyMinutes = $settings->missing_checkout_early_leave_minutes ?? 60;
        $now = Carbon::now();

        $openAttendances = Attendance::with('employee')
            ->whereNull('check_out_at')
            ->where('date', '<', $now->toDateString())
            ->get();

        $closedCount = 0;
        foreach ($openAttendances as $att) {
            $employee = $att->employee;
            if (! $employee) {
                continue;
            }

            $nextDayCheckin = Carbon::parse($att->date)->addDay()->setTimeFromTimeString($employee->check_in_time);

            if ($now->greaterThanOrEqualTo($nextDayCheckin)) {
                $scheduledOut = Carbon::parse($att->date . ' ' . $employee->check_out_time);
                $att->update([
                    'check_out_at' => $scheduledOut->copy()->subMinutes($penaltyMinutes),
                    'early_leave_minutes' => $penaltyMinutes,
                    'overtime_minutes' => 0,
                ]);
                $closedCount++;
            }
        }

        return $closedCount;
    }

    /**
     * Recalculate late, early leave, overtime for manual or updated record.
     */
    public function calculateMetrics(
        Employee $employee,
        string $date,
        Carbon $checkInAt,
        ?Carbon $checkOutAt = null
    ): array {
        $scheduledCheckIn = Carbon::parse($date . ' ' . $employee->check_in_time);
        $scheduledCheckOut = Carbon::parse($date . ' ' . $employee->check_out_time);

        if ($scheduledCheckOut->isBefore($scheduledCheckIn)) {
            $scheduledCheckOut->addDay();
        }

        $lateMinutes = 0;
        if ($checkInAt->isAfter($scheduledCheckIn)) {
            $lateMinutes = (int) $scheduledCheckIn->diffInMinutes($checkInAt);
        }

        $earlyLeaveMinutes = 0;
        $overtimeMinutes = 0;

        if ($checkOutAt) {
            if ($checkOutAt->isBefore($scheduledCheckOut)) {
                $earlyLeaveMinutes = (int) $checkOutAt->diffInMinutes($scheduledCheckOut);
            } elseif ($checkOutAt->isAfter($scheduledCheckOut)) {
                $overtimeMinutes = (int) $scheduledCheckOut->diffInMinutes($checkOutAt);
            }
        }

        return [
            'late_minutes' => $lateMinutes,
            'early_leave_minutes' => $earlyLeaveMinutes,
            'overtime_minutes' => $overtimeMinutes,
        ];
    }

    /**
     * Get monthly statistics for an employee.
     */
    public function getMonthlyStats(int $employeeId, int $year, int $month): array
    {
        $records = Attendance::where('employee_id', $employeeId)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->get();

        return [
            'total_days' => $records->count(),
            'late_count' => $records->where('late_minutes', '>', 0)->count(),
            'late_total_minutes' => (int) $records->sum('late_minutes'),
            'early_leave_count' => $records->where('early_leave_minutes', '>', 0)->count(),
            'early_leave_total_minutes' => (int) $records->sum('early_leave_minutes'),
            'overtime_count' => $records->where('overtime_minutes', '>', 0)->count(),
            'overtime_total_minutes' => (int) $records->sum('overtime_minutes'),
        ];
    }
}
