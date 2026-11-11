<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Employee;
use App\Models\Outlet;
use App\Models\SuperAdmin;
use App\Models\WebsiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OutletEmployeeLimitTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected Outlet $outlet1;
    protected Outlet $outlet2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

        $this->admin = Admin::create([
            'name' => 'Store Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('password123'),
            'store_id' => 'STR-TEST01',
            'max_outlets' => 5,
            'max_storage_mb' => 500,
            'max_employees_per_outlet' => 2, // Low limit for easy testing
            'is_lifetime_free' => true,
        ]);

        WebsiteSetting::create([
            'admin_id' => $this->admin->id,
            'brandname' => 'Test Store',
            'office_starting_time' => '09:00:00',
            'office_closing_time' => '17:00:00',
            'office_ipv4_addr' => '127.0.0.1',
        ]);

        $this->outlet1 = $this->admin->outlets()->create([
            'name' => 'Outlet Alpha',
            'wifi_ip' => '127.0.0.1',
        ]);

        $this->outlet2 = $this->admin->outlets()->create([
            'name' => 'Outlet Beta',
            'wifi_ip' => '192.168.1.1',
        ]);
    }

    public function test_owner_can_create_employee_up_to_the_limit(): void
    {
        // 1st employee in Outlet Alpha (allowed, count becomes 1/2)
        $response1 = $this->actingAs($this->admin, 'admin')->post('/store/employees', [
            'outlet_id' => $this->outlet1->id,
            'name' => 'Employee One',
            'phone' => '01700000001',
            'role' => 'Sales',
            'salary' => 15000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        $response1->assertRedirect(route('admin.employees.index'));
        $this->assertDatabaseHas('employees', [
            'name' => 'Employee One',
            'outlet_id' => $this->outlet1->id,
        ]);

        // 2nd employee in Outlet Alpha (allowed, count becomes 2/2)
        $response2 = $this->actingAs($this->admin, 'admin')->post('/store/employees', [
            'outlet_id' => $this->outlet1->id,
            'name' => 'Employee Two',
            'phone' => '01700000002',
            'role' => 'Manager',
            'salary' => 25000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        $response2->assertRedirect(route('admin.employees.index'));
        $this->assertDatabaseHas('employees', [
            'name' => 'Employee Two',
            'outlet_id' => $this->outlet1->id,
        ]);
        $this->assertEquals(2, $this->outlet1->employees()->count());
    }

    public function test_owner_cannot_create_employee_exceeding_the_outlet_limit(): void
    {
        // Seed 2 employees in Outlet Alpha (hitting limit of 2)
        $this->admin->employees()->create([
            'outlet_id' => $this->outlet1->id,
            'name' => 'Existing Emp 1',
            'phone' => '01700000001',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);
        $this->admin->employees()->create([
            'outlet_id' => $this->outlet1->id,
            'name' => 'Existing Emp 2',
            'phone' => '01700000002',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        // 3rd employee should be blocked
        $response = $this->actingAs($this->admin, 'admin')->from('/store/employees')->post('/store/employees', [
            'outlet_id' => $this->outlet1->id,
            'name' => 'Blocked Employee',
            'phone' => '01700000003',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        $response->assertSessionHas('error');
        $response->assertSessionHasErrors('outlet_id');
        $this->assertDatabaseMissing('employees', [
            'name' => 'Blocked Employee',
        ]);
        $this->assertEquals(2, $this->outlet1->employees()->count());

        // However, Outlet Beta has 0 employees, so owner CAN create an employee in Outlet Beta
        $responseBeta = $this->actingAs($this->admin, 'admin')->post('/store/employees', [
            'outlet_id' => $this->outlet2->id,
            'name' => 'Beta Employee',
            'phone' => '01700000004',
            'role' => 'Staff',
            'salary' => 12000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        $responseBeta->assertRedirect(route('admin.employees.index'));
        $this->assertDatabaseHas('employees', [
            'name' => 'Beta Employee',
            'outlet_id' => $this->outlet2->id,
        ]);
    }

    public function test_owner_cannot_transfer_employee_to_a_full_outlet(): void
    {
        // Outlet Alpha has 2 employees (full)
        $this->admin->employees()->create([
            'outlet_id' => $this->outlet1->id,
            'name' => 'Emp Alpha 1',
            'phone' => '01700000001',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);
        $this->admin->employees()->create([
            'outlet_id' => $this->outlet1->id,
            'name' => 'Emp Alpha 2',
            'phone' => '01700000002',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        // Outlet Beta has 1 employee
        $empBeta = $this->admin->employees()->create([
            'outlet_id' => $this->outlet2->id,
            'name' => 'Emp Beta',
            'phone' => '01700000003',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        // Try transferring Emp Beta to Outlet Alpha (full)
        $response = $this->actingAs($this->admin, 'admin')->from('/store/employees')->post("/store/employees/{$empBeta->id}", [
            'outlet_id' => $this->outlet1->id,
            'name' => 'Emp Beta',
            'phone' => '01700000003',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        $response->assertSessionHas('error');
        $this->assertEquals($this->outlet2->id, $empBeta->fresh()->outlet_id);
    }

    public function test_updating_employee_in_same_full_outlet_is_allowed(): void
    {
        // Outlet Alpha has 2 employees (full)
        $emp1 = $this->admin->employees()->create([
            'outlet_id' => $this->outlet1->id,
            'name' => 'Emp Alpha 1',
            'phone' => '01700000001',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);
        $this->admin->employees()->create([
            'outlet_id' => $this->outlet1->id,
            'name' => 'Emp Alpha 2',
            'phone' => '01700000002',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        // Updating salary of $emp1 in same outlet should succeed
        $response = $this->actingAs($this->admin, 'admin')->post("/store/employees/{$emp1->id}", [
            'outlet_id' => $this->outlet1->id,
            'name' => 'Emp Alpha 1 Updated',
            'phone' => '01700000001',
            'role' => 'Senior Staff',
            'salary' => 18000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);

        $response->assertRedirect(route('admin.employees.index'));
        $this->assertEquals(18000, $emp1->fresh()->salary);
        $this->assertEquals('Senior Staff', $emp1->fresh()->role);
    }

    public function test_super_admin_can_set_and_update_max_employees_per_outlet(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Super Admin',
            'email' => 'super@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Create store with custom max_employees_per_outlet
        $response = $this->actingAs($superAdmin, 'super_admin')->post('/super-admin/stores', [
            'name' => 'New Chain Store',
            'email' => 'chain@example.com',
            'password' => 'secret1234',
            'max_outlets' => 3,
            'max_employees_per_outlet' => 15,
            'max_storage_mb' => 200,
            'is_lifetime_free' => false,
            'monthly_fee' => 600,
            'session_time' => 30,
            'two_factor_enabled' => false,
        ]);

        $response->assertSessionHas('success');
        $createdStore = Admin::where('email', 'chain@example.com')->first();
        $this->assertNotNull($createdStore);
        $this->assertEquals(15, $createdStore->max_employees_per_outlet);

        // Update max_employees_per_outlet to 30
        $updateResponse = $this->actingAs($superAdmin, 'super_admin')->put("/super-admin/stores/{$createdStore->id}", [
            'name' => 'New Chain Store',
            'email' => 'chain@example.com',
            'max_outlets' => 4,
            'max_employees_per_outlet' => 30,
            'max_storage_mb' => 300,
            'is_lifetime_free' => false,
            'monthly_fee' => 700,
            'session_time' => 30,
            'two_factor_enabled' => false,
        ]);

        $updateResponse->assertSessionHas('success');
        $this->assertEquals(30, $createdStore->fresh()->max_employees_per_outlet);
    }

    public function test_individual_outlet_max_employees_override_is_respected(): void
    {
        // Admin has max_employees_per_outlet = 2
        // Outlet Beta has an override max_employees = 1
        $this->outlet2->update(['max_employees' => 1]);

        // 1st employee in Outlet Beta succeeds
        $res1 = $this->actingAs($this->admin, 'admin')->post('/store/employees', [
            'outlet_id' => $this->outlet2->id,
            'name' => 'Beta Emp 1',
            'phone' => '01711111111',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);
        $res1->assertRedirect(route('admin.employees.index'));
        $this->assertEquals(1, $this->outlet2->employees()->count());

        // 2nd employee in Outlet Beta should be blocked due to override of 1
        $res2 = $this->actingAs($this->admin, 'admin')->from('/store/employees')->post('/store/employees', [
            'outlet_id' => $this->outlet2->id,
            'name' => 'Beta Emp 2',
            'phone' => '01722222222',
            'role' => 'Staff',
            'salary' => 10000,
            'working_hours' => 8,
            'check_in_time' => '09:00',
            'check_out_time' => '17:00',
            'joining_date' => now()->toDateString(),
        ]);
        $res2->assertSessionHas('error');
        $this->assertEquals(1, $this->outlet2->employees()->count());
    }
}
