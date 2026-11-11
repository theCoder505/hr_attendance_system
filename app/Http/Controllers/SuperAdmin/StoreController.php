<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Employee;
use App\Models\WebsiteSetting;
use App\Services\StorageCalculatorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    /**
     * Display a listing of stores (admins).
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $query = Admin::withCount(['outlets', 'employees'])->orderBy('created_at', 'desc');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('store_id', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%");
            });
        }

        $stores = $query->paginate(12)->withQueryString();

        // Transform stores to include storage metrics
        $stores->through(function ($store) {
            $storageDetails = StorageCalculatorService::getStoreStorageDetails($store);

            return [
                'id' => $store->id,
                'uid' => $store->uid,
                'store_id' => $store->store_id,
                'name' => $store->name,
                'email' => $store->email,
                'max_outlets' => $store->max_outlets,
                'max_employees_per_outlet' => (int) ($store->max_employees_per_outlet ?: 25),
                'max_storage_mb' => $storageDetails['max_storage_mb'],
                'max_storage_formatted' => $storageDetails['max_storage_formatted'],
                'storage_used_percentage' => $storageDetails['used_percentage'],
                'is_lifetime_free' => (bool) $store->is_lifetime_free,
                'monthly_fee' => (float) ($store->monthly_fee ?? 500.00),
                'is_suspended' => $store->isSuspended(),
                'outlets_count' => $store->outlets_count,
                'employees_count' => $store->employees_count,
                'storage_bytes' => $storageDetails['total_bytes'],
                'storage_formatted' => $storageDetails['total_formatted'],
                'storage_breakdown' => [
                    'media_formatted' => $storageDetails['media_formatted'],
                    'attendance_formatted' => $storageDetails['attendance_formatted'],
                    'db_formatted' => $storageDetails['db_formatted'],
                ],
                'session_time' => $store->session_time,
                'two_factor_enabled' => (bool) $store->two_factor_enabled,
                'created_at' => $store->created_at?->toFormattedDateString(),
            ];
        });

        return Inertia::render('super-admin/stores/index', [
            'stores' => $stores,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created store (admin).
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:admins,email'],
            'password' => ['required', 'string', 'min:8'],
            'max_outlets' => ['required', 'integer', 'min:1', 'max:500'],
            'max_employees_per_outlet' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'max_storage_mb' => ['required', 'integer', 'min:10', 'max:102400'],
            'is_lifetime_free' => ['boolean'],
            'monthly_fee' => ['nullable', 'numeric', 'min:0'],
            'session_time' => ['nullable', 'integer', 'min:5', 'max:720'],
            'two_factor_enabled' => ['boolean'],
        ]);

        // Auto-generate unique Store ID strictly (Super Admin cannot set it)
        do {
            $storeId = 'STR-' . strtoupper(Str::random(6));
        } while (Admin::where('store_id', $storeId)->exists());

        DB::transaction(function () use ($request, $storeId) {
            $admin = Admin::create([
                'name' => trim($request->name),
                'email' => trim($request->email),
                'password' => Hash::make($request->password),
                'store_id' => $storeId,
                'max_outlets' => (int) $request->max_outlets,
                'max_employees_per_outlet' => (int) ($request->max_employees_per_outlet ?: 25),
                'max_storage_mb' => (int) ($request->max_storage_mb ?: 500),
                'is_lifetime_free' => $request->boolean('is_lifetime_free'),
                'monthly_fee' => $request->filled('monthly_fee') ? (float) $request->monthly_fee : 500.00,
                'session_time' => (int) ($request->session_time ?: 30),
                'two_factor_enabled' => $request->boolean('two_factor_enabled'),
            ]);

            // Create default settings for this store
            WebsiteSetting::create([
                'admin_id' => $admin->id,
                'brandname' => $admin->name,
                'logo' => null,
                'favicon' => null,
                'office_starting_time' => '09:00:00',
                'office_closing_time' => '17:00:00',
                'office_ipv4_addr' => '127.0.0.1',
                'missing_checkout_early_leave_minutes' => 60,
                'admin_login_2fa_enabled' => $admin->two_factor_enabled,
            ]);
        });

        return back()->with('success', "Store '{$request->name}' registered successfully with Store ID: {$storeId}.");
    }

    /**
     * Update the specified store (admin).
     */
    public function update(Request $request, Admin $store): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:admins,email,' . $store->id],
            'password' => ['nullable', 'string', 'min:8'],
            'max_outlets' => ['required', 'integer', 'min:1', 'max:500'],
            'max_employees_per_outlet' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'max_storage_mb' => ['required', 'integer', 'min:10', 'max:102400'],
            'is_lifetime_free' => ['boolean'],
            'monthly_fee' => ['nullable', 'numeric', 'min:0'],
            'session_time' => ['nullable', 'integer', 'min:5', 'max:720'],
            'two_factor_enabled' => ['boolean'],
        ]);

        $newMonthlyFee = $request->filled('monthly_fee') ? (float) $request->monthly_fee : 500.00;
        $isLifetimeFree = $request->boolean('is_lifetime_free');

        $data = [
            'name' => trim($request->name),
            'email' => trim($request->email),
            'max_outlets' => (int) $request->max_outlets,
            'max_employees_per_outlet' => (int) ($request->max_employees_per_outlet ?: 25),
            'max_storage_mb' => (int) ($request->max_storage_mb ?: 500),
            'is_lifetime_free' => $isLifetimeFree,
            'monthly_fee' => $newMonthlyFee,
            'session_time' => (int) ($request->session_time ?: 30),
            'two_factor_enabled' => $request->boolean('two_factor_enabled'),
        ];

        if (! empty($request->password)) {
            $data['password'] = Hash::make($request->password);
        }

        $store->update($data);

        // If the monthly fee was changed or store set to free, sync unpaid/pending/rejected invoices
        if ($isLifetimeFree) {
            // Cancel/delete unpaid invoices since the store is now lifetime free
            $store->invoices()->whereIn('status', ['unpaid', 'rejected'])->delete();
        } else {
            // Update the amount on unpaid/rejected invoices to reflect the newly specified custom fee
            $store->invoices()->whereIn('status', ['unpaid', 'rejected'])->update([
                'amount' => $newMonthlyFee,
            ]);
        }

        return back()->with('success', "Store '{$store->name}' updated successfully.");
    }

    /**
     * Remove the specified store and all its data.
     */
    public function destroy(Admin $store): RedirectResponse
    {
        $name = $store->name;
        $disk = Storage::disk('public');

        // Explicitly cleanup all employee media files
        foreach ($store->employees as $employee) {
            if ($employee->image && $disk->exists($employee->image)) {
                $disk->delete($employee->image);
            }
            if ($employee->appointment_letter && $disk->exists($employee->appointment_letter)) {
                $disk->delete($employee->appointment_letter);
            }
        }

        // Cleanup store setting files
        if ($store->setting) {
            if ($store->setting->logo && $disk->exists($store->setting->logo)) {
                $disk->delete($store->setting->logo);
            }
            if ($store->setting->favicon && $disk->exists($store->setting->favicon)) {
                $disk->delete($store->setting->favicon);
            }
        }

        // Explicit cascade removal of all related entities
        DB::transaction(function () use ($store) {
            $store->attendances()->delete();
            $store->employees()->delete();
            $store->outlets()->delete();
            $store->invoices()->delete();
            $store->setting()?->delete();
            $store->delete();
        });

        return back()->with('success', "Store '{$name}' and all associated outlets, employees, attendance records, invoices, and files have been permanently and irreversibly removed.");
    }

    /**
     * Display employees of a specific store for super admin inspection and management.
     */
    public function employees(Request $request, Admin $store): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $query = $store->employees()->with('outlet')->withCount('attendances')->orderBy('created_at', 'desc');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('status', (int) $status);
        }

        $employees = $query->paginate(15)->withQueryString();

        return Inertia::render('super-admin/stores/employees', [
            'store' => [
                'id' => $store->id,
                'uid' => $store->uid,
                'store_id' => $store->store_id,
                'name' => $store->name,
                'email' => $store->email,
                'max_outlets' => $store->max_outlets,
                'max_employees_per_outlet' => (int) ($store->max_employees_per_outlet ?: 25),
                'outlets_count' => $store->outlets()->count(),
                'employees_count' => $store->employees()->count(),
                'storage_formatted' => $store->formatted_storage,
                'currencySymbol' => $store->setting?->currency_symbol ?: 'BDT',
            ],
            'currencySymbol' => $store->setting?->currency_symbol ?: 'BDT',
            'employees' => $employees,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    /**
     * Reset verification for an employee of a specific store.
     */
    public function resetEmployeeVerification(Admin $store, Employee $employee): RedirectResponse
    {
        if ($employee->admin_id !== $store->id) {
            abort(403);
        }

        $token = $employee->resetForReverification();
        $link = url("/verify/{$token}");

        return back()->with([
            'success' => "Device reset successfully! New verification link generated for {$employee->name}.",
            'new_verification_link' => $link,
        ]);
    }

    /**
     * Delete an employee of a specific store.
     */
    public function deleteEmployee(Admin $store, Employee $employee): RedirectResponse
    {
        if ($employee->admin_id !== $store->id) {
            abort(403);
        }

        $name = $employee->name;
        $employee->delete();

        return back()->with('success', "Employee '{$name}' was removed from {$store->name}.");
    }
}

