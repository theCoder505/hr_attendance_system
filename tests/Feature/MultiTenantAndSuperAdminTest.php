<?php

namespace Tests\Feature;

use App\Mail\ContactOtpMail;
use App\Mail\ContactReplyMail;
use App\Mail\SuperAdminOtpMail;
use App\Models\Admin;
use App\Models\ContactInquiry;
use App\Models\Employee;
use App\Models\Outlet;
use App\Models\SuperAdmin;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MultiTenantAndSuperAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    /**
     * Test Super Admin login with seeded credentials.
     */
    public function test_super_admin_can_login()
    {
        $superAdmin = SuperAdmin::firstOrCreate(
            ['email' => 'admin@super.com'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('SuperAdmin@1234'),
                'session_time' => 30,
            ]
        );

        $response = $this->post('/super-admin/login', [
            'email' => 'admin@super.com',
            'password' => 'SuperAdmin@1234',
        ]);

        $response->assertRedirect('/super-admin/dashboard');
        $this->assertAuthenticatedAs($superAdmin, 'super_admin');
    }

    /**
     * Test Super Admin can CRUD stores and enforce maximum outlet limits.
     */
    public function test_super_admin_can_create_and_manage_stores()
    {
        $superAdmin = SuperAdmin::where('email', 'admin@super.com')->first();
        if (! $superAdmin) {
            $superAdmin = SuperAdmin::create([
                'name' => 'Super Admin',
                'email' => 'admin@super.com',
                'password' => Hash::make('SuperAdmin@1234'),
            ]);
        }

        // 1. Create Store via Super Admin (Store ID is strictly auto-generated)
        $response = $this->actingAs($superAdmin, 'super_admin')->post('/super-admin/stores', [
            'name' => 'Test Tenant Retail',
            'email' => 'tenant@retail.com',
            'password' => 'TenantPass@1234',
            'max_outlets' => 2,
            'session_time' => 30,
            'two_factor_enabled' => false,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('admins', [
            'email' => 'tenant@retail.com',
            'max_outlets' => 2,
        ]);

        $storeAdmin = Admin::where('email', 'tenant@retail.com')->first();
        $this->assertNotEmpty($storeAdmin->store_id);
        $this->assertStringStartsWith('STR-', $storeAdmin->store_id);

        // 2. Check Outlet Creation under Store Admin (Max 2 outlets)
        $this->actingAs($storeAdmin, 'admin')->post('/store/outlets', [
            'name' => 'Outlet 1',
            'wifi_ip' => '127.0.0.1',
        ])->assertSessionHas('success');

        $this->actingAs($storeAdmin, 'admin')->post('/store/outlets', [
            'name' => 'Outlet 2',
            'wifi_ip' => '127.0.0.1',
        ])->assertSessionHas('success');

        // Third outlet should be blocked by max_outlets limit
        $this->actingAs($storeAdmin, 'admin')->post('/store/outlets', [
            'name' => 'Outlet 3',
            'wifi_ip' => '127.0.0.1',
        ])->assertSessionHas('error');

        $this->assertEquals(2, $storeAdmin->outlets()->count());

        // 3. Super Admin increases max_outlets to 4
        $this->actingAs($superAdmin, 'super_admin')->put("/super-admin/stores/{$storeAdmin->id}", [
            'name' => 'Test Tenant Retail Updated',
            'email' => 'tenant@retail.com',
            'max_outlets' => 4,
            'session_time' => 45,
            'two_factor_enabled' => false,
        ])->assertSessionHas('success');

        $storeAdmin->refresh();
        $this->assertEquals(4, $storeAdmin->max_outlets);

        // Now Store Admin can add 3rd outlet
        $this->actingAs($storeAdmin, 'admin')->post('/store/outlets', [
            'name' => 'Outlet 3',
            'wifi_ip' => '127.0.0.1',
        ])->assertSessionHas('success');

        $this->assertEquals(3, $storeAdmin->outlets()->count());

        // Verify store/settings page reflects dynamic max_outlets set by super admin
        $settingsResponse = $this->actingAs($storeAdmin, 'admin')->get('/store/settings');
        $settingsResponse->assertOk();
        $settingsResponse->assertInertia(fn ($page) => 
            $page->component('admin/settings/index')
                ->where('admin.max_outlets', 4)
                ->where('admin.store_id', $storeAdmin->store_id)
        );
    }

    /**
     * Test tenant data isolation between two store admins.
     */
    public function test_store_admin_data_isolation()
    {
        $admin1 = Admin::create([
            'name' => 'Store Alpha',
            'email' => 'alpha@stores.com',
            'password' => Hash::make('Password@123'),
            'store_id' => 'STR-ALPHA',
            'max_outlets' => 5,
        ]);

        $admin2 = Admin::create([
            'name' => 'Store Beta',
            'email' => 'beta@stores.com',
            'password' => Hash::make('Password@123'),
            'store_id' => 'STR-BETA',
            'max_outlets' => 5,
        ]);

        $outlet1 = $admin1->outlets()->create(['name' => 'Alpha Outlet 1', 'wifi_ip' => '127.0.0.1']);
        $outlet2 = $admin2->outlets()->create(['name' => 'Beta Outlet 1', 'wifi_ip' => '127.0.0.1']);

        $emp1 = $admin1->employees()->create([
            'name' => 'Alpha Worker',
            'phone' => '111111',
            'role' => 'Staff',
            'outlet_id' => $outlet1->id,
            'joining_date' => now()->toDateString(),
        ]);

        $emp2 = $admin2->employees()->create([
            'name' => 'Beta Worker',
            'phone' => '222222',
            'role' => 'Staff',
            'outlet_id' => $outlet2->id,
            'joining_date' => now()->toDateString(),
        ]);

        // Store 1 admin tries to delete Store 2 employee -> should be forbidden (403)
        $this->actingAs($admin1, 'admin')->delete("/store/employees/{$emp2->id}")->assertStatus(403);

        // Store 1 admin tries to delete Store 2 outlet -> should be forbidden (403)
        $this->actingAs($admin1, 'admin')->delete("/store/outlets/{$outlet2->id}")->assertStatus(403);
    }

    /**
     * Test attendance device token and store_id checking.
     */
    public function test_attendance_verification_and_store_id_validation()
    {
        $admin = Admin::create([
            'name' => 'Attendance Store',
            'email' => 'attend@store.com',
            'password' => Hash::make('Password@123'),
            'store_id' => 'STR-ATTEND',
            'max_outlets' => 5,
            'is_lifetime_free' => true,
        ]);

        $outlet = $admin->outlets()->create(['name' => 'HQ Outlet', 'wifi_ip' => '127.0.0.1']);

        $employee = $admin->employees()->create([
            'name' => 'John Doe',
            'phone' => '987654321',
            'role' => 'Cashier',
            'outlet_id' => $outlet->id,
            'joining_date' => now()->toDateString(),
        ]);

        $verificationToken = $employee->verification_token;
        $this->assertNotEmpty($verificationToken);

        // 1. Visit verification link -> binds device
        $response = $this->get("/verify/{$verificationToken}");
        $response->assertStatus(200);

        $employee->refresh();
        $this->assertEquals(1, $employee->status);
        $this->assertNotEmpty($employee->device_token_hash);

        // 2. Mock raw device token
        $rawDeviceToken = 'valid-test-raw-token-12345678901234567890123456789012345678901234';
        $employee->update([
            'device_token_hash' => hash('sha256', $rawDeviceToken),
            'device_token_expires_at' => now()->addMonth(),
        ]);

        // 3. Status call with correct store_id -> success
        $this->withHeaders([
            'X-Device-Token' => $rawDeviceToken,
            'X-Outlet-Uid' => $outlet->uid,
            'X-Store-Id' => 'STR-ATTEND',
        ])->getJson('/attendance/status')
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        // 4. Status call with mismatched store_id -> 403 STORE_MISMATCH
        $this->withHeaders([
            'X-Device-Token' => $rawDeviceToken,
            'X-Outlet-Uid' => $outlet->uid,
            'X-Store-Id' => 'STR-WRONG-STORE',
        ])->getJson('/attendance/status')
            ->assertStatus(403)
            ->assertJson(['code' => 'STORE_MISMATCH']);
    }

    /**
     * Test Contact Page: OTP email verification + inquiry submission + Super Admin reply email.
     */
    public function test_contact_page_inquiry_and_reply_flow()
    {
        $superAdmin = SuperAdmin::firstOrCreate(
            ['email' => 'admin@super.com'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('SuperAdmin@1234'),
            ]
        );

        $inquirerEmail = 'owner@prospective-store.com';

        // 1. Send OTP to contact email
        $this->postJson('/contact/send-otp', [
            'email' => $inquirerEmail,
        ])->assertStatus(200)->assertJson(['success' => true]);

        Mail::assertSent(ContactOtpMail::class);

        $otp = session('contact_otp');
        $this->assertNotEmpty($otp);

        // 2. Verify OTP
        $this->postJson('/contact/verify-otp', [
            'email' => $inquirerEmail,
            'otp' => $otp,
        ])->assertStatus(200)->assertJson(['success' => true]);

        $this->assertTrue(session('contact_email_verified'));

        // 3. Submit inquiry (does not send email immediately)
        $this->postJson('/contact', [
            'company_name' => 'Prospective Store Chain',
            'subject' => 'Need 10 Outlets Attendance Solution',
            'email' => $inquirerEmail,
            'phone' => '+1 555 777 8888',
            'total_outlets' => 10,
            'avg_employees_per_outlet' => 8,
            'message' => 'We are opening 10 new outlets and would like to use your platform.',
        ])->assertStatus(200)->assertJson(['success' => true]);

        $this->assertDatabaseHas('contact_inquiries', [
            'email' => $inquirerEmail,
            'status' => 'pending',
            'total_outlets' => 10,
        ]);

        $inquiry = ContactInquiry::where('email', $inquirerEmail)->first();

        // 4. Super Admin views and replies to inquiry
        $replyResponse = $this->actingAs($superAdmin, 'super_admin')->post("/super-admin/inquiries/{$inquiry->id}/reply", [
            'reply_message' => 'Hello! We would love to onboard your 10 outlets. Here are your onboarding instructions...',
        ]);

        $replyResponse->assertSessionHas('success');

        $inquiry->refresh();
        $this->assertEquals('replied', $inquiry->status);
        $this->assertNotNull($inquiry->replied_at);
        $this->assertNotEmpty($inquiry->reply_message);

        // Verified that reply email is dispatched using the template
        Mail::assertSent(ContactReplyMail::class, function ($mail) use ($inquirerEmail) {
            return $mail->hasTo($inquirerEmail);
        });
    }

    /**
     * Test Super Admin profile credential update via OTP.
     */
    public function test_super_admin_profile_otp_update()
    {
        $superAdmin = SuperAdmin::firstOrCreate(
            ['email' => 'admin@super.com'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('SuperAdmin@1234'),
            ]
        );

        // 1. Request OTP
        $this->actingAs($superAdmin, 'super_admin')
            ->post('/super-admin/settings/credentials/otp')
            ->assertSessionHas('success');

        Mail::assertSent(SuperAdminOtpMail::class);

        $superAdmin->refresh();
        $otp = $superAdmin->otp;
        $this->assertNotEmpty($otp);

        // 2. Submit credentials change with valid OTP
        $this->actingAs($superAdmin, 'super_admin')->post('/super-admin/settings/credentials', [
            'otp' => $otp,
            'email' => 'newsuper@super.com',
            'current_password' => 'SuperAdmin@1234',
            'password' => 'NewSuperAdmin@2026',
            'password_confirmation' => 'NewSuperAdmin@2026',
        ])->assertSessionHas('success');

        $superAdmin->refresh();
        $this->assertEquals('newsuper@super.com', $superAdmin->email);
        $this->assertTrue(Hash::check('NewSuperAdmin@2026', $superAdmin->password));

        // Restore original for subsequent tests / seeder consistency
        $superAdmin->update([
            'email' => 'admin@super.com',
            'password' => Hash::make('SuperAdmin@1234'),
        ]);
    }

    /**
     * Test billing settings configuration, invoice generation, payment submission, and verification.
     */
    public function test_billing_settings_invoices_and_verification_flow()
    {
        $superAdmin = SuperAdmin::firstOrCreate(
            ['email' => 'admin@super.com'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('SuperAdmin@1234'),
            ]
        );

        // 1. Super Admin configures billing receiving details and payment due day
        $this->actingAs($superAdmin, 'super_admin')->post('/super-admin/settings/billing', [
            'payment_due_day' => 10,
            'default_monthly_fee' => 750.00,
            'bkash_number' => '01711223344',
            'bkash_type' => 'Merchant',
            'bkash_enabled' => true,
            'nagad_number' => '01811223344',
            'nagad_type' => 'Personal',
            'nagad_enabled' => false, // test turning off Nagad
            'bank_name' => 'City Bank',
            'bank_account_name' => 'AttendEase Platform Ltd',
            'bank_account_number' => '11029384756',
            'bank_branch' => 'Gulshan',
            'bank_routing' => '225271829',
            'bank_enabled' => true,
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('platform_settings', [
            'payment_due_day' => 10,
            'bkash_number' => '01711223344',
            'bkash_enabled' => true,
            'nagad_enabled' => false,
            'bank_enabled' => true,
            'bank_name' => 'City Bank',
        ]);

        // 2. Create paid store and test invoice auto-generation
        $store = Admin::create([
            'name' => 'Downtown Store',
            'username' => 'downtown_store',
            'email' => 'downtown@store.com',
            'password' => Hash::make('StorePass123!'),
            'status' => 'active',
            'is_lifetime_free' => false,
            'monthly_fee' => 750.00,
        ]);

        $invoice = $store->getOrCreateCurrentInvoice();
        $this->assertNotNull($invoice);
        $this->assertEquals('unpaid', $invoice->status);
        $this->assertEquals(750.00, (float) $invoice->amount);

        // 3. Store owner submits payment details with exact paid amount
        $this->actingAs($store, 'admin')->post("/store/invoices/{$invoice->id}/pay", [
            'paid_amount' => 750.00,
            'payment_method' => 'bkash',
            'transaction_id' => 'TRX99887766',
            'payment_time' => '2026-11-05 14:30:00',
            'payment_note' => 'Sent from 01712345678',
        ])->assertSessionHas('success');

        $invoice->refresh();
        $this->assertEquals('pending_verification', $invoice->status);
        $this->assertEquals(750.00, (float) $invoice->paid_amount);
        $this->assertEquals('TRX99887766', $invoice->transaction_id);

        // 4. Super Admin verifies and accepts payment
        $this->actingAs($superAdmin, 'super_admin')
            ->post("/super-admin/invoices/{$invoice->id}/verify")
            ->assertSessionHas('success');

        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
        $this->assertNotNull($invoice->verified_at);
        $this->assertFalse($store->fresh()->isSuspended());

        // 5. Rejection flow test
        $invoice->update(['status' => 'pending_verification']);
        $this->actingAs($superAdmin, 'super_admin')->post("/super-admin/invoices/{$invoice->id}/reject", [
            'rejection_reason' => 'TrxID could not be verified in bKash merchant statement.',
        ])->assertSessionHas('success');

        $invoice->refresh();
        $this->assertEquals('rejected', $invoice->status);
        $this->assertEquals('TrxID could not be verified in bKash merchant statement.', $invoice->rejection_reason);
    }

    /**
     * Test lifetime free store exemption from suspension and invoices.
     */
    public function test_lifetime_free_store_is_never_suspended()
    {
        $freeStore = Admin::create([
            'name' => 'Community Free Store',
            'username' => 'free_store',
            'email' => 'free@store.com',
            'password' => Hash::make('StorePass123!'),
            'status' => 'active',
            'is_lifetime_free' => true,
        ]);

        // Even past due date with no invoices, lifetime free store is not suspended
        $this->assertFalse($freeStore->isSuspended());

        // Accessing /store/invoices redirects with notice
        $this->actingAs($freeStore, 'admin')
            ->get('/store/invoices')
            ->assertRedirect('/store/dashboard');

        // Suspended page redirects to index if store is not suspended or store is missing
        $this->get('/attendance/suspended?store_id=' . $freeStore->store_id)
            ->assertRedirect(route('attendance.index'));

        $this->get('/attendance/suspended')
            ->assertRedirect(route('attendance.index'));
    }

    /**
     * Test User Manual PDF viewing and complete store deletion cascade.
     */
    public function test_user_manual_pdf_view_and_store_deletion_cascade()
    {
        $superAdmin = SuperAdmin::firstOrCreate(
            ['email' => 'admin@super.com'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('SuperAdmin@1234'),
            ]
        );

        // 1. Public user manual page returns 200 with PDF url
        $response = $this->get('/user-manual');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('pdfUrl'));

        // 2. Store owner user manual page returns 200 with PDF url
        $store = Admin::create([
            'name' => 'Outlet Store Alpha',
            'username' => 'outlet_alpha',
            'email' => 'alpha@store.com',
            'password' => Hash::make('StorePass123!'),
            'status' => 'active',
        ]);

        $outlet = $store->outlets()->create(['name' => 'Main Outlet', 'wifi_ip' => '127.0.0.1']);
        $employee = $store->employees()->create([
            'name' => 'Test Employee',
            'phone' => '01700000000',
            'role' => 'Sales',
            'outlet_id' => $outlet->id,
            'joining_date' => now()->toDateString(),
        ]);
        $store->attendances()->create([
            'employee_id' => $employee->id,
            'date' => now()->toDateString(),
            'check_in_at' => now(),
            'late_minutes' => 0,
        ]);
        $invoice = $store->getOrCreateCurrentInvoice();

        $this->actingAs($store, 'admin')
            ->get('/store/user-manual')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('pdfUrl'));

        // 3. Super Admin permanently deletes the store
        $this->actingAs($superAdmin, 'super_admin')
            ->delete("/super-admin/stores/{$store->id}")
            ->assertSessionHas('success');

        // Verify total cascade wipe
        $this->assertDatabaseMissing('admins', ['id' => $store->id]);
        $this->assertDatabaseMissing('outlets', ['id' => $outlet->id]);
        $this->assertDatabaseMissing('employees', ['id' => $employee->id]);
        $this->assertDatabaseMissing('attendances', ['employee_id' => $employee->id]);
        $this->assertDatabaseMissing('store_invoices', ['id' => $invoice->id]);
    }
}
