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
     * Display settings page.
     */
    public function index(Request $request): Response
    {
        $settings = WebsiteSetting::current();
        $admin = Auth::guard('admin')->user();

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
            'admin' => [
                'name' => $admin->name,
                'email' => $admin->email,
                'session_time' => $admin->session_time,
            ],
            'clientIp' => $request->ip(),
        ]);
    }

    /**
     * Update website / attendance rules settings.
     */
    public function updateGeneral(UpdateSettingsRequest $request): RedirectResponse
    {
        $settings = WebsiteSetting::current();
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if (! empty($settings->logo) && Storage::disk('public')->exists($settings->logo)) {
                Storage::disk('public')->delete($settings->logo);
            }
            $data['logo'] = $request->file('logo')->store('settings', 'public');
        }

        if ($request->hasFile('favicon')) {
            if (! empty($settings->favicon) && Storage::disk('public')->exists($settings->favicon)) {
                Storage::disk('public')->delete($settings->favicon);
            }
            $data['favicon'] = $request->file('favicon')->store('settings', 'public');
        }

        $settings->update($data);

        return back()->with('success', 'Website & Attendance settings updated successfully.');
    }

    /**
     * Update basic admin profile details (Name, Session Timeout).
     */
    public function updateProfile(UpdateAdminProfileRequest $request): RedirectResponse
    {
        $admin = Auth::guard('admin')->user();
        $admin->update($request->validated());

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
