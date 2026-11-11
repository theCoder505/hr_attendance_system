<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\ContactInquiry;
use App\Models\Employee;
use App\Models\Outlet;
use App\Models\SuperAdmin;
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
        // 1. Seed Super Admin as per specification
        SuperAdmin::firstOrCreate(
            ['email' => 'admin@super.com'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('SuperAdmin@1234'),
                'session_time' => 30,
            ]
        );

        // 2. Seed Default Store Admin
        $defaultAdmin = Admin::firstOrCreate(
            ['email' => 'admin@attendance.com'],
            [
                'name' => 'Flagship Store Admin',
                'store_id' => 'STR-MAIN01',
                'password' => Hash::make('MyPass@2026#'),
                'session_time' => 30,
                'max_outlets' => 5,
                'max_employees_per_outlet' => 25,
            ]
        );

        // Ensure store_id and quotas are populated
        if (empty($defaultAdmin->store_id)) {
            $defaultAdmin->update([
                'store_id' => 'STR-MAIN01',
                'max_outlets' => 5,
                'max_employees_per_outlet' => 25,
            ]);
        }

        // 3. Seed Website Settings row
        $setting = WebsiteSetting::firstOrCreate(
            ['id' => 1],
            [
                'admin_id' => $defaultAdmin->id,
                'brandname' => 'AttendEase Pro',
                'logo' => null,
                'favicon' => null,
                'office_starting_time' => '09:00:00',
                'office_closing_time' => '17:00:00',
                'office_ipv4_addr' => '127.0.0.1',
                'missing_checkout_early_leave_minutes' => 60,
                'admin_login_2fa_enabled' => true,
            ]
        );

        if (empty($setting->admin_id)) {
            $setting->update(['admin_id' => $defaultAdmin->id]);
        }

        // 4. Ensure default outlet is linked to default admin
        $defaultOutlet = Outlet::first();
        if ($defaultOutlet && empty($defaultOutlet->admin_id)) {
            $defaultOutlet->update(['admin_id' => $defaultAdmin->id]);
        }

        // 5. Seed Sample Employees for quick testing if none exist
        if (Employee::count() === 0) {
            Employee::create([
                'admin_id' => $defaultAdmin->id,
                'outlet_id' => $defaultOutlet?->id,
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
                'admin_id' => $defaultAdmin->id,
                'outlet_id' => $defaultOutlet?->id,
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
        } else {
            Employee::whereNull('admin_id')->update(['admin_id' => $defaultAdmin->id]);
        }

        // 6. Seed a sample contact inquiry if none exist
        if (ContactInquiry::count() === 0) {
            ContactInquiry::create([
                'company_name' => 'Metropolis Retailers Ltd.',
                'subject' => 'Inquiry for 8 Retail Stores Expansion',
                'email' => 'contact@metropolis-retail.com',
                'phone' => '+1 (555) 345-9876',
                'total_outlets' => 8,
                'avg_employees_per_outlet' => 12,
                'message' => 'Hello, we are expanding our operations across 8 regional outlets and would like to register with your attendance platform. Please let us know the onboarding procedure.',
                'status' => 'pending',
            ]);
        }
    }
}
