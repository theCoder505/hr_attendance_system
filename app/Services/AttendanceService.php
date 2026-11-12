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
            $settings = WebsiteSetting::forAdmin($employee->admin_id);
            $checkInTime = $employee->check_in_time ?: ($settings->office_starting_time ?? '09:00:00');
            $todayNextCheckin = Carbon::parse($today . ' ' . $checkInTime);
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
        $settings = WebsiteSetting::forAdmin($employee->admin_id);
        $scheduledStartTime = $employee->check_in_time ?: ($settings->office_starting_time ?? '09:00:00');
        $scheduledCheckIn = Carbon::parse($date . ' ' . $scheduledStartTime);
        $lateMinutes = 0;
        if ($time->isAfter($scheduledCheckIn)) {
            $lateMinutes = (int) $scheduledCheckIn->diffInMinutes($time);
        }

        $attendance = Attendance::create([
            'admin_id' => $employee->admin_id,
            'outlet_id' => $employee->outlet_id,
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

        $lateFormatted = sprintf('%02d:%02d', floor($lateMinutes / 60), $lateMinutes % 60);

        return [
            'success' => true,
            'message' => 'Checked in successfully' . ($lateMinutes > 0 ? " (Late by {$lateFormatted})" : '!'),
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

        $checkInAt = Carbon::parse($activeAttendance->check_in_at);
        $metrics = $this->calculateMetrics(
            $employee,
            $activeAttendance->date,
            $checkInAt,
            $time
        );

        $resolvedCheckOut = $metrics['adjusted_check_out_at'] ?? $time;

        $activeAttendance->update([
            'check_out_at' => $resolvedCheckOut,
            'late_minutes' => $metrics['late_minutes'],
            'early_leave_minutes' => $metrics['early_leave_minutes'],
            'overtime_minutes' => $metrics['overtime_minutes'],
        ]);

        $earlyLeaveMinutes = $metrics['early_leave_minutes'];
        $overtimeMinutes = $metrics['overtime_minutes'];

        $parts = [];
        if ($earlyLeaveMinutes > 0) {
            $earlyFormatted = sprintf('%02d:%02d', floor($earlyLeaveMinutes / 60), $earlyLeaveMinutes % 60);
            $parts[] = "Early leave: {$earlyFormatted}";
        }
        if ($overtimeMinutes > 0) {
            $otFormatted = sprintf('%02d:%02d', floor($overtimeMinutes / 60), $overtimeMinutes % 60);
            $parts[] = "Overtime: {$otFormatted}";
        }

        return [
            'success' => true,
            'message' => 'Checked out successfully' . (! empty($parts) ? ' (' . implode(', ', $parts) . ')' : '!'),
            'attendance' => $activeAttendance,
            'metrics' => $metrics,
        ];
    }

    /**
     * Auto close any open attendance for this employee where next check-in window has arrived.
     */
    public function autoCloseExpiredAttendancesForEmployee(Employee $employee): void
    {
        $settings = WebsiteSetting::forAdmin($employee->admin_id);
        $penaltyMinutes = $settings->missing_checkout_early_leave_minutes ?? 60;
        $now = Carbon::now();

        $openAttendances = Attendance::where('employee_id', $employee->id)
            ->whereNull('check_out_at')
            ->where('date', '<', $now->toDateString())
            ->get();

        foreach ($openAttendances as $att) {
            $startTimeStr = $employee->check_in_time ?: ($settings->office_starting_time ?? '09:00:00');
            $endTimeStr = $employee->check_out_time ?: ($settings->office_closing_time ?? '17:00:00');

            // Next check-in window began at employee's check_in_time on the next calendar day
            $nextDayCheckin = Carbon::parse($att->date)->addDay()->setTimeFromTimeString($startTimeStr);

            if ($now->greaterThanOrEqualTo($nextDayCheckin)) {
                $scheduledIn = Carbon::parse($att->date . ' ' . $startTimeStr);
                $scheduledOut = Carbon::parse($att->date . ' ' . $endTimeStr);
                if ($scheduledOut->isBefore($scheduledIn)) {
                    $scheduledOut->addDay();
                }

                $autoCheckOut = $scheduledOut->copy()->subMinutes($penaltyMinutes);
                $checkInAt = Carbon::parse($att->check_in_at);
                if ($autoCheckOut->isBefore($checkInAt)) {
                    $autoCheckOut = $checkInAt->copy();
                }

                $metrics = $this->calculateMetrics($employee, $att->date, $checkInAt, $autoCheckOut);

                $att->update([
                    'check_out_at' => $autoCheckOut,
                    'early_leave_minutes' => max($penaltyMinutes, $metrics['early_leave_minutes']),
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

            $settings = WebsiteSetting::forAdmin($employee->admin_id);
            $penaltyMinutes = $settings->missing_checkout_early_leave_minutes ?? 60;

            $startTimeStr = $employee->check_in_time ?: ($settings->office_starting_time ?? '09:00:00');
            $endTimeStr = $employee->check_out_time ?: ($settings->office_closing_time ?? '17:00:00');

            $nextDayCheckin = Carbon::parse($att->date)->addDay()->setTimeFromTimeString($startTimeStr);

            if ($now->greaterThanOrEqualTo($nextDayCheckin)) {
                $scheduledIn = Carbon::parse($att->date . ' ' . $startTimeStr);
                $scheduledOut = Carbon::parse($att->date . ' ' . $endTimeStr);
                if ($scheduledOut->isBefore($scheduledIn)) {
                    $scheduledOut->addDay();
                }

                $autoCheckOut = $scheduledOut->copy()->subMinutes($penaltyMinutes);
                $checkInAt = Carbon::parse($att->check_in_at);
                if ($autoCheckOut->isBefore($checkInAt)) {
                    $autoCheckOut = $checkInAt->copy();
                }

                $metrics = $this->calculateMetrics($employee, $att->date, $checkInAt, $autoCheckOut);

                $att->update([
                    'check_out_at' => $autoCheckOut,
                    'early_leave_minutes' => max($penaltyMinutes, $metrics['early_leave_minutes']),
                    'overtime_minutes' => 0,
                ]);
                $closedCount++;
            }
        }

        return $closedCount;
    }

    /**
     * Recalculate late, early leave, overtime, and working duration for an attendance record.
     *
     * Rules:
     * 1. Total Working Duration = Check-Out Time - Check-In Time (in minutes)
     * 2. Late Arrival: If Check-In is later than scheduled office start time, diff in minutes. Otherwise 0.
     * 3. Early Leave: If Check-Out is earlier than scheduled office end time, diff in minutes. Otherwise 0.
     * 4. Overtime: max(0, Actual Working Duration - Scheduled Working Duration).
     *    Never calculated simply because Check-Out is later than scheduled end time.
     *    Scheduled Working Duration is calculated from office start and end times,
     *    taking into account configured working hours (excluding unpaid breaks).
     * 5. Handles overnight shifts safely.
     *
     * @return array{
     *     late_minutes: int,
     *     early_leave_minutes: int,
     *     overtime_minutes: int,
     *     total_working_minutes: int,
     *     scheduled_working_minutes: int,
     *     adjusted_check_out_at: ?Carbon
     * }
     */
    public function calculateMetrics(
        Employee $employee,
        string $date,
        Carbon $checkInAt,
        ?Carbon $checkOutAt = null
    ): array {
        $settings = WebsiteSetting::forAdmin($employee->admin_id);
        $startTimeStr = $employee->check_in_time ?: ($settings->office_starting_time ?? '09:00:00');
        $endTimeStr = $employee->check_out_time ?: ($settings->office_closing_time ?? '17:00:00');

        $scheduledCheckIn = Carbon::parse($date . ' ' . $startTimeStr);
        $scheduledCheckOut = Carbon::parse($date . ' ' . $endTimeStr);

        // Overnight shift: scheduled check-out time is earlier than scheduled check-in time
        if ($scheduledCheckOut->isBefore($scheduledCheckIn)) {
            $scheduledCheckOut->addDay();
        }

        // Scheduled shift span in minutes
        $scheduledShiftMinutes = (int) $scheduledCheckIn->diffInMinutes($scheduledCheckOut);

        // Scheduled Working Duration:
        // Excludes any configured unpaid breaks (configured working_hours <= scheduledShiftMinutes)
        $configuredHours = (float) ($employee->working_hours > 0 ? $employee->working_hours : 8.0);
        $configuredMinutes = (int) round($configuredHours * 60);

        $scheduledWorkingMinutes = ($configuredMinutes > 0 && $configuredMinutes <= $scheduledShiftMinutes)
            ? $configuredMinutes
            : $scheduledShiftMinutes;

        // 1. Late Arrival
        $lateMinutes = 0;
        if ($checkInAt->isAfter($scheduledCheckIn)) {
            $lateMinutes = (int) $scheduledCheckIn->diffInMinutes($checkInAt);
        }

        $earlyLeaveMinutes = 0;
        $overtimeMinutes = 0;
        $actualWorkedMinutes = 0;

        if ($checkOutAt) {
            // Check if checkout timestamp needs next-day rollover:
            // e.g. checkOutAt is before checkInAt
            if ($checkOutAt->isBefore($checkInAt)) {
                $checkOutAt = $checkOutAt->copy()->addDay();
            }

            // Total Working Duration = Check-Out Time - Check-In Time
            $actualWorkedMinutes = (int) max(0, $checkInAt->diffInMinutes($checkOutAt));

            // 2. Early Leave: Check-Out earlier than scheduled office end time
            if ($checkOutAt->isBefore($scheduledCheckOut)) {
                $earlyLeaveMinutes = (int) $checkOutAt->diffInMinutes($scheduledCheckOut);
            }

            // 3. Overtime: max(0, Actual Working Duration - Scheduled Working Duration)
            $overtimeMinutes = (int) max(0, $actualWorkedMinutes - $scheduledWorkingMinutes);
        }

        return [
            'late_minutes' => $lateMinutes,
            'early_leave_minutes' => $earlyLeaveMinutes,
            'overtime_minutes' => $overtimeMinutes,
            'total_working_minutes' => $actualWorkedMinutes,
            'scheduled_working_minutes' => $scheduledWorkingMinutes,
            'adjusted_check_out_at' => $checkOutAt,
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

        $totalWorkedMinutes = 0;
        foreach ($records as $record) {
            if ($record->check_in_at && $record->check_out_at) {
                $cIn = Carbon::parse($record->check_in_at);
                $cOut = Carbon::parse($record->check_out_at);
                if ($cOut->isBefore($cIn)) {
                    $cOut->addDay();
                }
                $totalWorkedMinutes += max(0, $cIn->diffInMinutes($cOut));
            }
        }

        return [
            'total_days' => $records->count(),
            'late_count' => $records->where('late_minutes', '>', 0)->count(),
            'late_total_minutes' => (int) $records->sum('late_minutes'),
            'early_leave_count' => $records->where('early_leave_minutes', '>', 0)->count(),
            'early_leave_total_minutes' => (int) $records->sum('early_leave_minutes'),
            'overtime_count' => $records->where('overtime_minutes', '>', 0)->count(),
            'overtime_total_minutes' => (int) $records->sum('overtime_minutes'),
            'total_worked_minutes' => $totalWorkedMinutes,
        ];
    }
}
