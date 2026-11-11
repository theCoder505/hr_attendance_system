<?php

use App\Http\Controllers\SuperAdmin\AuthController as SuperAdminAuthController;
use App\Http\Controllers\SuperAdmin\ContactInquiryController as SuperAdminInquiryController;
use App\Http\Controllers\SuperAdmin\DashboardController as SuperAdminDashboardController;
use App\Http\Controllers\SuperAdmin\InvoiceController as SuperAdminInvoiceController;
use App\Http\Controllers\SuperAdmin\ProfileController as SuperAdminProfileController;
use App\Http\Controllers\SuperAdmin\StoreController as SuperAdminStoreController;
use App\Http\Controllers\SuperAdmin\UserManualController as SuperAdminUserManualController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Super Administration Routes
| Prefix: /super-admin
|--------------------------------------------------------------------------
*/
Route::prefix('super-admin')->name('super-admin.')->group(function () {
    // Guest Super Admin Auth routes
    Route::middleware('guest:super_admin')->group(function () {
        Route::get('/login', [SuperAdminAuthController::class, 'showLogin'])->name('login');
        Route::post('/login', [SuperAdminAuthController::class, 'login'])->name('login.post');
    });

    // Authenticated Super Admin routes
    Route::middleware(['auth:super_admin', 'admin.timeout'])->group(function () {
        Route::post('/logout', [SuperAdminAuthController::class, 'logout'])->name('logout');

        // Dashboard & Store Storage Metrics
        Route::get('/', [SuperAdminDashboardController::class, 'index'])->name('index');
        Route::get('/dashboard', [SuperAdminDashboardController::class, 'index'])->name('dashboard');

        // Stores (Admins) CRUD & Outlets quota
        Route::get('/stores', [SuperAdminStoreController::class, 'index'])->name('stores.index');
        Route::post('/stores', [SuperAdminStoreController::class, 'store'])->name('stores.store');
        Route::put('/stores/{store}', [SuperAdminStoreController::class, 'update'])->name('stores.update');
        Route::delete('/stores/{store}', [SuperAdminStoreController::class, 'destroy'])->name('stores.destroy');

        // Store Employee Management
        Route::get('/stores/{store}/employees', [SuperAdminStoreController::class, 'employees'])->name('stores.employees');
        Route::post('/stores/{store}/employees/{employee}/reset-verification', [SuperAdminStoreController::class, 'resetEmployeeVerification'])->name('stores.employees.reset-verification');
        Route::delete('/stores/{store}/employees/{employee}', [SuperAdminStoreController::class, 'deleteEmployee'])->name('stores.employees.delete');

        // Contact Inquiries & Reply
        Route::get('/inquiries', [SuperAdminInquiryController::class, 'index'])->name('inquiries.index');
        Route::post('/inquiries/{inquiry}/reply', [SuperAdminInquiryController::class, 'reply'])->name('inquiries.reply');
        Route::delete('/inquiries/{inquiry}', [SuperAdminInquiryController::class, 'destroy'])->name('inquiries.destroy');

        // Settings (Branding & Identity, Profile, Billing Accounts & Credential Changes with OTP Verification)
        Route::get('/settings', [SuperAdminProfileController::class, 'index'])->name('profile.index');
        Route::post('/settings', [SuperAdminProfileController::class, 'updateProfile'])->name('profile.update');
        Route::post('/settings/branding', [SuperAdminProfileController::class, 'updateBranding'])->name('profile.branding');
        Route::post('/settings/billing', [SuperAdminProfileController::class, 'updateBillingSettings'])->name('profile.billing');
        Route::post('/settings/credentials/otp', [SuperAdminProfileController::class, 'requestCredentialsOtp'])->name('profile.credentials.otp');
        Route::post('/settings/credentials', [SuperAdminProfileController::class, 'updateCredentials'])->name('profile.credentials');

        // Store Invoices & Verification
        Route::get('/invoices', [SuperAdminInvoiceController::class, 'index'])->name('invoices.index');
        Route::post('/invoices/{invoice}/verify', [SuperAdminInvoiceController::class, 'verify'])->name('invoices.verify');
        Route::post('/invoices/{invoice}/reject', [SuperAdminInvoiceController::class, 'reject'])->name('invoices.reject');

        // User Manual Dynamic CMS
        Route::get('/user-manual', [SuperAdminUserManualController::class, 'index'])->name('user-manual.index');
        Route::post('/user-manual', [SuperAdminUserManualController::class, 'update'])->name('user-manual.update');
    });
});

