<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Employee;
use App\Models\WebsiteSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Default Admin as per specification
        Admin::firstOrCreate(
            ['email' => 'admin@attendance.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('MyPass@2026#'),
                'session_time' => 30,
            ]
        );

        // 2. Seed Website Settings row
        WebsiteSetting::firstOrCreate(
            ['id' => 1],
            [
                'brandname' => 'AttendEase Pro',
                'logo' => null,
                'favicon' => null,
                'office_starting_time' => '09:00:00',
                'office_closing_time' => '17:00:00',
                'office_ipv4_addr' => '127.0.0.1',
                'missing_checkout_early_leave_minutes' => 60,
            ]
        );

        // 3. Seed Sample Employees for quick testing if none exist
        if (Employee::count() === 0) {
            Employee::create([
                'name' => 'Alexander Hayes',
                'phone' => '+1 (555) 234-5678',
                'role' => 'Senior Software Engineer',
                'work_desc' => 'Core backend architecture and API performance.',
                'salary' => 7500.00,
                'working_hours' => 8.0,
                'check_in_time' => '09:00:00',
                'check_out_time' => '17:00:00',
                'joining_date' => now()->subMonths(8)->toDateString(),
                'status' => 0,
            ]);

            Employee::create([
                'name' => 'Sarah Jenkins',
                'phone' => '+1 (555) 876-5432',
                'role' => 'Product Designer',
                'work_desc' => 'UI/UX systems and employee experience workflows.',
                'salary' => 6800.00,
                'working_hours' => 8.0,
                'check_in_time' => '09:30:00',
                'check_out_time' => '17:30:00',
                'joining_date' => now()->subMonths(4)->toDateString(),
                'status' => 0,
            ]);
        }
    }
}
