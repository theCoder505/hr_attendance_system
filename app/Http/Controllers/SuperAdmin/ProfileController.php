<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Mail\SuperAdminOtpMail;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display Super Admin profile settings view.
     */
    public function index(): Response
    {
        $superAdmin = Auth::guard('super_admin')->user();
        $platform = PlatformSetting::instance();

        return Inertia::render('super-admin/profile/index', [
            'superAdmin' => [
                'id' => $superAdmin->id,
                'name' => $superAdmin->name,
                'email' => $superAdmin->email,
                'session_time' => $superAdmin->session_time,
                'created_at' => $superAdmin->created_at?->toFormattedDateString(),
            ],
            'billingSettings' => [
                'bkash_number' => $platform->bkash_number,
                'bkash_type' => $platform->bkash_type,
                'bkash_enabled' => (bool) $platform->bkash_enabled,
                'nagad_number' => $platform->nagad_number,
                'nagad_type' => $platform->nagad_type,
                'nagad_enabled' => (bool) $platform->nagad_enabled,
                'bank_name' => $platform->bank_name,
                'bank_account_name' => $platform->bank_account_name,
                'bank_account_number' => $platform->bank_account_number,
                'bank_branch' => $platform->bank_branch,
                'bank_routing' => $platform->bank_routing,
                'bank_enabled' => (bool) $platform->bank_enabled,
                'payment_due_day' => (int) ($platform->payment_due_day ?: 7),
                'default_monthly_fee' => (float) ($platform->default_monthly_fee ?: 500.00),
            ],
        ]);
    }

    /**
     * Update payment receiving details & monthly subscription deadline.
     */
    public function updateBillingSettings(Request $request): RedirectResponse
    {
        $request->validate([
            'bkash_number' => ['nullable', 'string', 'max:50'],
            'bkash_type' => ['required', 'string', 'in:Personal,Merchant,Agent'],
            'bkash_enabled' => ['boolean'],
            'nagad_number' => ['nullable', 'string', 'max:50'],
            'nagad_type' => ['required', 'string', 'in:Personal,Merchant,Agent'],
            'nagad_enabled' => ['boolean'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:100'],
            'bank_branch' => ['nullable', 'string', 'max:100'],
            'bank_routing' => ['nullable', 'string', 'max:50'],
            'bank_enabled' => ['boolean'],
            'payment_due_day' => ['required', 'integer', 'min:1', 'max:31'],
            'default_monthly_fee' => ['required', 'numeric', 'min:0'],
        ]);

        $platform = PlatformSetting::instance();
        $platform->update([
            'bkash_number' => $request->bkash_number,
            'bkash_type' => $request->bkash_type,
            'bkash_enabled' => $request->boolean('bkash_enabled'),
            'nagad_number' => $request->nagad_number,
            'nagad_type' => $request->nagad_type,
            'nagad_enabled' => $request->boolean('nagad_enabled'),
            'bank_name' => $request->bank_name,
            'bank_account_name' => $request->bank_account_name,
            'bank_account_number' => $request->bank_account_number,
            'bank_branch' => $request->bank_branch,
            'bank_routing' => $request->bank_routing,
            'bank_enabled' => $request->boolean('bank_enabled'),
            'payment_due_day' => (int) $request->payment_due_day,
            'default_monthly_fee' => (float) $request->default_monthly_fee,
        ]);

        return back()->with('success', 'Platform billing receiving accounts & deadline settings updated successfully.');
    }

    /**
     * Update basic profile details (Name, Session Timeout).
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $superAdmin = Auth::guard('super_admin')->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'session_time' => ['nullable', 'integer', 'min:5', 'max:720'],
        ]);

        $superAdmin->update([
            'name' => trim($data['name']),
            'session_time' => (int) ($data['session_time'] ?: 30),
        ]);

        return back()->with('success', 'Super admin profile updated successfully.');
    }

    /**
     * Request OTP to change super admin email or password.
     */
    public function requestCredentialsOtp(): RedirectResponse
    {
        $superAdmin = Auth::guard('super_admin')->user();
        $otp = $superAdmin->generateOtp(10);

        try {
            Mail::to($superAdmin->email)->send(new SuperAdminOtpMail($otp, 'Security Credentials Update'));
        } catch (\Throwable $e) {
            Log::error('Failed to send Super Admin credentials update OTP: ' . $e->getMessage());
        }

        return back()->with('success', "A 6-digit OTP code has been dispatched to {$superAdmin->email}. Please enter it to authorize the changes.");
    }

    /**
     * Update super admin email and/or password with OTP verification.
     */
    public function updateCredentials(Request $request): RedirectResponse
    {
        $superAdmin = Auth::guard('super_admin')->user();

        $request->validate([
            'otp' => ['required', 'string', 'size:6'],
            'email' => ['nullable', 'email', 'max:255', 'unique:super_admins,email,' . $superAdmin->id],
            'current_password' => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (! $superAdmin->verifyOtp($request->otp)) {
            return back()->withErrors(['otp' => 'Invalid or expired OTP code. Please request a new code.']);
        }

        // Update email if provided
        if (! empty($request->email) && $request->email !== $superAdmin->email) {
            $superAdmin->email = trim(strtolower($request->email));
        }

        // Update password if provided
        if (! empty($request->password)) {
            if (! empty($request->current_password) && ! Hash::check($request->current_password, $superAdmin->password)) {
                return back()->withErrors(['current_password' => 'The provided current password does not match our records.']);
            }
            $superAdmin->password = Hash::make($request->password);
        }

        $superAdmin->save();

        return back()->with('success', 'Super admin credentials updated successfully!');
    }
}

