<?php

use App\Http\Controllers\Admin\AttendanceController as AdminAttendanceController;
use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EmployeeController as AdminEmployeeController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Employee\AttendancePageController;
use App\Http\Controllers\Employee\VerificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Home redirects to Employee Attendance portal
Route::get('/', function () {
    return redirect()->route('attendance.index');
})->name('home');

/*
|--------------------------------------------------------------------------
| Employee Verification & Attendance Portal
|--------------------------------------------------------------------------
*/
// Single-use device verification link
Route::get('/verify/{token}', [VerificationController::class, 'verify'])->name('employee.verify');

// Public attendance page
Route::get('/attendance', [AttendancePageController::class, 'index'])->name('attendance.index');

// Protected attendance action endpoints (Office IP + Registered Device Token)
Route::prefix('attendance')->middleware(['office.network', 'verify.device'])->group(function () {
    Route::get('/status', [AttendancePageController::class, 'status'])->name('attendance.status');
    Route::post('/check-in', [AttendancePageController::class, 'checkIn'])->name('attendance.check-in');
    Route::post('/check-out', [AttendancePageController::class, 'checkOut'])->name('attendance.check-out');
    Route::get('/history', [AttendancePageController::class, 'history'])->name('attendance.history');
});

/*
|--------------------------------------------------------------------------
| Administration Control Routes (Admin)
| Prefix: /administration-control
|--------------------------------------------------------------------------
*/
Route::prefix('administration-control')->name('admin.')->group(function () {
    // Guest Admin Auth routes
    Route::middleware('guest:admin')->group(function () {
        Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('login');
        Route::post('/login', [AdminAuthController::class, 'login'])->name('login.post');
        Route::get('/otp', [AdminAuthController::class, 'showOtp'])->name('otp.show');
        Route::post('/otp', [AdminAuthController::class, 'verifyOtp'])->name('otp.verify');
        Route::post('/otp/resend', [AdminAuthController::class, 'resendOtp'])->name('otp.resend');
    });

    // Authenticated Admin routes with Session Inactivity Timeout Middleware
    Route::middleware(['auth:admin', 'admin.timeout'])->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');

        // Dashboard & Calendar
        Route::get('/', [AdminDashboardController::class, 'index'])->name('index');
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Employees CRUD & Re-verification
        Route::get('/employees', [AdminEmployeeController::class, 'index'])->name('employees.index');
        Route::post('/employees', [AdminEmployeeController::class, 'store'])->name('employees.store');
        Route::post('/employees/{employee}', [AdminEmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{employee}', [AdminEmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::post('/employees/{employee}/reset-verification', [AdminEmployeeController::class, 'resetVerification'])->name('employees.reset-verification');

        // Manual Attendance Management
        Route::post('/attendances', [AdminAttendanceController::class, 'store'])->name('attendances.store');
        Route::put('/attendances/{attendance}', [AdminAttendanceController::class, 'update'])->name('attendances.update');
        Route::delete('/attendances/{attendance}', [AdminAttendanceController::class, 'destroy'])->name('attendances.destroy');

        // Monthly Reports & XLSX Export
        Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/export', [AdminReportController::class, 'export'])->name('reports.export');

        // Settings & Admin Profile
        Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings/general', [AdminSettingsController::class, 'updateGeneral'])->name('settings.general');
        Route::post('/settings/profile', [AdminSettingsController::class, 'updateProfile'])->name('settings.profile');
        Route::post('/settings/credentials/otp', [AdminSettingsController::class, 'requestCredentialsOtp'])->name('settings.credentials.otp');
        Route::post('/settings/credentials', [AdminSettingsController::class, 'updateCredentials'])->name('settings.credentials');
    });
});
