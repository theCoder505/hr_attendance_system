<?php

namespace Tests\Unit;

use App\Models\Admin;
use App\Models\Employee;
use App\Models\Outlet;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceCalculationTest extends TestCase
{
    use RefreshDatabase;

    protected AttendanceService $service;
    protected Employee $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AttendanceService();

        $admin = Admin::create([
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'phone' => '1234567890',
            'password' => bcrypt('password'),
            'store_id' => 'STR-TEST',
            'status' => 1,
        ]);

        $outlet = Outlet::create([
            'admin_id' => $admin->id,
            'name' => 'Main Outlet',
            'wifi_ip' => '127.0.0.1',
        ]);

        $this->employee = Employee::create([
            'admin_id' => $admin->id,
            'outlet_id' => $outlet->id,
            'uid' => 'EMP-TEST01',
            'name' => 'John Doe',
            'phone' => '01700000000',
            'role' => 'Staff',
            'salary' => 30000,
            'working_hours' => 8.00,
            'check_in_time' => '09:00:00',
            'check_out_time' => '17:00:00',
            'joining_date' => '2026-01-01',
            'status' => 1,
        ]);
    }

    /**
     * Case 1: On-time arrival and on-time checkout.
     * Scheduled 09:00 - 17:00 (8h = 480m).
     */
    public function test_on_time_arrival_and_on_time_checkout(): void
    {
        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 09:00:00');
        $checkOut = Carbon::parse('2026-11-12 17:00:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(0, $metrics['late_minutes']);
        $this->assertEquals(0, $metrics['early_leave_minutes']);
        $this->assertEquals(0, $metrics['overtime_minutes']);
        $this->assertEquals(480, $metrics['total_working_minutes']);
        $this->assertEquals(480, $metrics['scheduled_working_minutes']);
    }

    /**
     * Case 2: Late arrival but works beyond scheduled checkout without exceeding duration.
     * Arrives 09:30 (Late 30m), checks out 17:30 (worked 480m = 8h).
     * Overtime must be 0!
     */
    public function test_late_arrival_working_beyond_scheduled_checkout_without_exceeding_duration(): void
    {
        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 09:30:00');
        $checkOut = Carbon::parse('2026-11-12 17:30:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(30, $metrics['late_minutes'], 'Late arrival should be 30 minutes');
        $this->assertEquals(0, $metrics['early_leave_minutes'], 'Early leave should be 0');
        $this->assertEquals(0, $metrics['overtime_minutes'], 'Overtime must be 0 because actual duration did not exceed 8h scheduled');
        $this->assertEquals(480, $metrics['total_working_minutes']);
    }

    /**
     * Case 3: Late arrival and works enough past checkout to earn overtime.
     * Arrives 09:30 (Late 30m), checks out 18:00 (worked 510m = 8.5h).
     * Overtime must be 30m!
     */
    public function test_late_arrival_working_beyond_scheduled_checkout_with_overtime(): void
    {
        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 09:30:00');
        $checkOut = Carbon::parse('2026-11-12 18:00:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(30, $metrics['late_minutes']);
        $this->assertEquals(0, $metrics['early_leave_minutes']);
        $this->assertEquals(30, $metrics['overtime_minutes']);
        $this->assertEquals(510, $metrics['total_working_minutes']);
    }

    /**
     * Case 4: Early arrival and late checkout.
     * Arrives 08:30 (Late 0m), checks out 17:30 (Early leave 0m).
     * Actual working duration = 9h = 540m. Scheduled = 480m.
     * Overtime must be 60m (not just 30m from office close!).
     */
    public function test_early_arrival_and_late_checkout(): void
    {
        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 08:30:00');
        $checkOut = Carbon::parse('2026-11-12 17:30:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(0, $metrics['late_minutes']);
        $this->assertEquals(0, $metrics['early_leave_minutes']);
        $this->assertEquals(60, $metrics['overtime_minutes'], 'Overtime must be based on actual working duration exceeding scheduled hours');
        $this->assertEquals(540, $metrics['total_working_minutes']);
    }

    /**
     * Case 5: On-time arrival and late checkout.
     * Arrives 09:00, checks out 18:00 (worked 540m).
     * Overtime must be 60m.
     */
    public function test_on_time_arrival_and_late_checkout(): void
    {
        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 09:00:00');
        $checkOut = Carbon::parse('2026-11-12 18:00:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(0, $metrics['late_minutes']);
        $this->assertEquals(0, $metrics['early_leave_minutes']);
        $this->assertEquals(60, $metrics['overtime_minutes']);
        $this->assertEquals(540, $metrics['total_working_minutes']);
    }

    /**
     * Case 6: Late arrival and early leave.
     * Arrives 09:30 (Late 30m), checks out 16:30 (Early leave 30m).
     * Worked = 420m.
     * Overtime must be 0! Both late and early leave shown accurately and independently.
     */
    public function test_late_arrival_and_early_leave(): void
    {
        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 09:30:00');
        $checkOut = Carbon::parse('2026-11-12 16:30:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(30, $metrics['late_minutes']);
        $this->assertEquals(30, $metrics['early_leave_minutes']);
        $this->assertEquals(0, $metrics['overtime_minutes']);
        $this->assertEquals(420, $metrics['total_working_minutes']);
    }

    /**
     * Case 7: Early arrival and early leave with actual duration exceeding scheduled.
     * Arrives 04:16 (0m late), leaves 15:00 (120m early leave relative to 17:00).
     * Total worked = 644m (10h 44m).
     * Overtime = max(0, 644 - 480) = 164m!
     */
    public function test_early_arrival_and_early_leave_with_overtime(): void
    {
        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 04:16:00');
        $checkOut = Carbon::parse('2026-11-12 15:00:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(0, $metrics['late_minutes']);
        $this->assertEquals(120, $metrics['early_leave_minutes']);
        $this->assertEquals(164, $metrics['overtime_minutes']);
        $this->assertEquals(644, $metrics['total_working_minutes']);
    }

    /**
     * Case 8: Configured unpaid break is excluded from scheduled working duration.
     * Shift 09:00 - 18:00 (9h = 540m span), working_hours = 8.00 (1h unpaid break).
     * Employee works 09:00 - 18:00 (540m).
     * Scheduled working duration is 480m, so Overtime = 540 - 480 = 60m.
     */
    public function test_configured_unpaid_break_respected(): void
    {
        $this->employee->update([
            'check_in_time' => '09:00:00',
            'check_out_time' => '18:00:00',
            'working_hours' => 8.00,
        ]);

        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 09:00:00');
        $checkOut = Carbon::parse('2026-11-12 18:00:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(480, $metrics['scheduled_working_minutes']);
        $this->assertEquals(540, $metrics['total_working_minutes']);
        $this->assertEquals(60, $metrics['overtime_minutes']);
        $this->assertEquals(0, $metrics['late_minutes']);
        $this->assertEquals(0, $metrics['early_leave_minutes']);
    }

    /**
     * Case 9: Overnight shift normal on-time schedule.
     * Shift 22:00 to 06:00 next day (8h = 480m).
     */
    public function test_overnight_shift_normal_schedule(): void
    {
        $this->employee->update([
            'check_in_time' => '22:00:00',
            'check_out_time' => '06:00:00',
            'working_hours' => 8.00,
        ]);

        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 22:00:00');
        $checkOut = Carbon::parse('2026-11-13 06:00:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(0, $metrics['late_minutes']);
        $this->assertEquals(0, $metrics['early_leave_minutes']);
        $this->assertEquals(0, $metrics['overtime_minutes']);
        $this->assertEquals(480, $metrics['total_working_minutes']);
    }

    /**
     * Case 10: Overnight shift with late arrival and overtime.
     * Shift 22:00 to 06:00 (480m).
     * Check-in 22:30 (Late 30m), Check-out 07:00 next day (worked 510m).
     * Overtime must be 30m!
     */
    public function test_overnight_shift_late_and_overtime(): void
    {
        $this->employee->update([
            'check_in_time' => '22:00:00',
            'check_out_time' => '06:00:00',
            'working_hours' => 8.00,
        ]);

        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 22:30:00');
        $checkOut = Carbon::parse('2026-11-13 07:00:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(30, $metrics['late_minutes']);
        $this->assertEquals(0, $metrics['early_leave_minutes']);
        $this->assertEquals(30, $metrics['overtime_minutes']);
        $this->assertEquals(510, $metrics['total_working_minutes']);
    }

    /**
     * Case 11: Overnight shift with early leave.
     * Shift 22:00 to 06:00 (480m).
     * Check-in 22:00, Check-out 05:00 next day (Early leave 60m, worked 420m).
     */
    public function test_overnight_shift_early_leave(): void
    {
        $this->employee->update([
            'check_in_time' => '22:00:00',
            'check_out_time' => '06:00:00',
            'working_hours' => 8.00,
        ]);

        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 22:00:00');
        $checkOut = Carbon::parse('2026-11-13 05:00:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, $checkOut);

        $this->assertEquals(0, $metrics['late_minutes']);
        $this->assertEquals(60, $metrics['early_leave_minutes']);
        $this->assertEquals(0, $metrics['overtime_minutes']);
        $this->assertEquals(420, $metrics['total_working_minutes']);
    }

    /**
     * Case 12: Missing check-out is handled safely.
     */
    public function test_missing_checkout_handling(): void
    {
        $date = '2026-11-12';
        $checkIn = Carbon::parse('2026-11-12 09:15:00');

        $metrics = $this->service->calculateMetrics($this->employee, $date, $checkIn, null);

        $this->assertEquals(15, $metrics['late_minutes']);
        $this->assertEquals(0, $metrics['early_leave_minutes']);
        $this->assertEquals(0, $metrics['overtime_minutes']);
        $this->assertEquals(0, $metrics['total_working_minutes']);
    }
}

