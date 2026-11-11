<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAdminCredentialsRequest;
use App\Http\Requests\Admin\UpdateAdminProfileRequest;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Mail\AdminOtpMail;
use App\Models\WebsiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display settings page for authenticated store admin.
     */
    public function index(Request $request): Response
    {
        $admin = Auth::guard('admin')->user();
        $settings = WebsiteSetting::forAdmin($admin->id);
        $outlets = $admin->outlets()->withCount(['employees', 'attendances'])->orderBy('id')->get();

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
            'outlets' => $outlets,
            'admin' => [
                'id' => $admin->id,
                'uid' => $admin->uid,
                'store_id' => $admin->store_id,
                'name' => $admin->name,
                'email' => $admin->email,
                'session_time' => $admin->session_time,
                'max_outlets' => (int) ($admin->max_outlets ?: 5),
                'two_factor_enabled' => (bool) $admin->two_factor_enabled,
            ],
            'clientIp' => $request->ip(),
        ]);
    }

    /**
     * Update attendance rules settings for this store.
     */
    public function updateGeneral(UpdateSettingsRequest $request): RedirectResponse
    {
        $admin = Auth::guard('admin')->user();
        $settings = WebsiteSetting::forAdmin($admin->id);
        $data = $request->validated();
        $data['admin_login_2fa_enabled'] = $request->boolean('admin_login_2fa_enabled');

        if (empty(trim((string) ($data['office_ipv4_addr'] ?? '')))) {
            $data['office_ipv4_addr'] = '127.0.0.1';
        }

        $currency = trim((string) ($data['currency_symbol'] ?? ''));

        $settings->update([
            'currency_symbol' => ! empty($currency) ? $currency : 'BDT',
            'office_starting_time' => $data['office_starting_time'],
            'office_closing_time' => $data['office_closing_time'],
            'office_ipv4_addr' => $data['office_ipv4_addr'],
            'missing_checkout_early_leave_minutes' => $data['missing_checkout_early_leave_minutes'],
            'admin_login_2fa_enabled' => $data['admin_login_2fa_enabled'],
        ]);

        return back()->with('success', 'Attendance & Security rules updated successfully.');
    }

    /**
     * Update basic admin profile details (Name, Session Timeout, 2FA preference).
     */
    public function updateProfile(UpdateAdminProfileRequest $request): RedirectResponse
    {
        $admin = Auth::guard('admin')->user();
        $data = $request->validated();
        $data['two_factor_enabled'] = $request->boolean('two_factor_enabled');
        $admin->update($data);

        return back()->with('success', 'Admin profile updated successfully.');
    }

    /**
     * Request OTP to change admin email or password.
     */
    public function requestCredentialsOtp(Request $request): RedirectResponse
    {
        $admin = Auth::guard('admin')->user();
        $otp = $admin->generateOtp(10);

        try {
            Mail::to($admin->email)->send(new AdminOtpMail($otp, 'Security Credentials Update'));
        } catch (\Throwable $e) {
            Log::error('Failed to send credentials update OTP: ' . $e->getMessage());
        }

        return back()->with('success', "A 6-digit OTP code has been dispatched to {$admin->email}. Please enter it to verify the changes.");
    }

    /**
     * Update admin credentials (Email / Password) after OTP verification.
     */
    public function updateCredentials(UpdateAdminCredentialsRequest $request): RedirectResponse
    {
        $admin = Auth::guard('admin')->user();

        if (! $admin->verifyOtp($request->otp)) {
            return back()->withErrors(['otp' => 'Invalid or expired OTP code. Please request a new one.']);
        }

        // If updating email
        if (! empty($request->email) && $request->email !== $admin->email) {
            $request->validate([
                'email' => ['unique:admins,email,' . $admin->id],
            ]);
            $admin->email = $request->email;
        }

        // If updating password
        if (! empty($request->password)) {
            if (! empty($request->current_password) && ! Hash::check($request->current_password, $admin->password)) {
                return back()->withErrors(['current_password' => 'The provided current password does not match.']);
            }
            $admin->password = Hash::make($request->password);
        }

        $admin->save();

        return back()->with('success', 'Security credentials updated successfully.');
    }
}
