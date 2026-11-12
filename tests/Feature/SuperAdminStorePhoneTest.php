<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\StoreInvoice;
use App\Models\SuperAdmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SuperAdminStorePhoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_add_store_phone_number_and_view_it(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Root Super Admin',
            'email' => 'super@root.com',
            'password' => bcrypt('password123'),
        ]);

        // 1. Super admin registers new store with phone number
        $response = $this->actingAs($superAdmin, 'super_admin')->post('/super-admin/stores', [
            'name' => 'Fashion Store Dhaka',
            'email' => 'dhaka@fashion.com',
            'phone' => '+8801712345678',
            'password' => 'password123',
            'max_outlets' => 3,
            'max_employees_per_outlet' => 30,
            'max_storage_mb' => 200,
            'is_lifetime_free' => false,
            'monthly_fee' => 700,
            'session_time' => 45,
            'two_factor_enabled' => true,
        ]);

        $response->assertSessionHas('success');

        $store = Admin::where('email', 'dhaka@fashion.com')->first();
        $this->assertNotNull($store);
        $this->assertSame('+8801712345678', $store->phone);

        // 2. Super admin views store in stores list
        $listResponse = $this->actingAs($superAdmin, 'super_admin')->get('/super-admin/stores');
        $listResponse->assertOk();
        $listResponse->assertInertia(fn (Assert $page) => $page
            ->component('super-admin/stores/index')
            ->has('stores.data', 1, fn (Assert $item) => $item
                ->where('name', 'Fashion Store Dhaka')
                ->where('phone', '+8801712345678')
                ->etc()
            )
        );

        // 3. Super admin updates store phone number
        $updateResponse = $this->actingAs($superAdmin, 'super_admin')->put("/super-admin/stores/{$store->id}", [
            'name' => 'Fashion Store Dhaka Updated',
            'email' => 'dhaka@fashion.com',
            'phone' => '+8801999888777',
            'max_outlets' => 3,
            'max_employees_per_outlet' => 30,
            'max_storage_mb' => 200,
            'is_lifetime_free' => false,
            'monthly_fee' => 700,
            'session_time' => 45,
            'two_factor_enabled' => true,
        ]);

        $updateResponse->assertSessionHas('success');
        $store->refresh();
        $this->assertSame('+8801999888777', $store->phone);
    }

    public function test_super_admin_can_see_store_owner_phone_on_invoices(): void
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Root Super Admin',
            'email' => 'super@root.com',
            'password' => bcrypt('password123'),
        ]);

        $store = Admin::create([
            'name' => 'Electro Mart',
            'email' => 'owner@electromart.com',
            'phone' => '+8801811223344',
            'password' => bcrypt('password123'),
            'store_id' => 'STR-ELEC01',
            'max_outlets' => 5,
        ]);

        $invoice = StoreInvoice::create([
            'admin_id' => $store->id,
            'invoice_number' => 'INV-202611-STRELEC01-101',
            'billing_month' => '2026-11',
            'amount' => 500.00,
            'due_date' => '2026-11-20',
            'status' => 'unpaid',
        ]);

        $invoiceResponse = $this->actingAs($superAdmin, 'super_admin')->get('/super-admin/invoices');
        $invoiceResponse->assertOk();
        $invoiceResponse->assertInertia(fn (Assert $page) => $page
            ->component('super-admin/invoices/index')
            ->has('invoices.data', 1, fn (Assert $item) => $item
                ->where('invoice_number', 'INV-202611-STRELEC01-101')
                ->where('admin.phone', '+8801811223344')
                ->where('admin.name', 'Electro Mart')
                ->etc()
            )
        );
    }

    public function test_store_owner_cannot_see_or_modify_private_phone_number(): void
    {
        $store = Admin::create([
            'name' => 'Secret Phone Store',
            'email' => 'owner@secret.com',
            'phone' => '+8801555666777',
            'password' => bcrypt('password123'),
            'store_id' => 'STR-SECRET',
            'max_outlets' => 2,
        ]);

        // 1. In model toArray() and toJson(), phone is hidden
        $storeArray = $store->toArray();
        $this->assertArrayNotHasKey('phone', $storeArray);
        $this->assertStringNotContainsString('+8801555666777', json_encode($store));

        // 2. In Store Admin Settings page, phone is not shared or exposed
        $settingsResponse = $this->actingAs($store, 'admin')->get('/store/settings');
        $settingsResponse->assertOk();
        $settingsResponse->assertInertia(fn (Assert $page) => $page
            ->component('admin/settings/index')
            ->missing('admin.phone')
            ->where('admin.email', 'owner@secret.com')
        );

        // 3. Store owner cannot update phone via profile update request
        $updateProfileResponse = $this->actingAs($store, 'admin')->post('/store/settings/profile', [
            'name' => 'Hacked Name',
            'session_time' => 30,
            'phone' => '+8801000000000',
        ]);

        $store->refresh();
        $this->assertSame('+8801555666777', $store->phone);
    }
}
