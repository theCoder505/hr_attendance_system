<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminLoginRequest;
use App\Http\Requests\Admin\VerifyOtpRequest;
use App\Mail\AdminOtpMail;
use App\Models\Admin;
use App\Models\WebsiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Show admin login view.
     */
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }

        $settings = WebsiteSetting::current();

        return Inertia::render('admin/auth/login', [
            'brandname' => $settings->brandname ?? 'AttendEase',
            'logo' => $settings->logo,
        ]);
    }

    /**
     * Handle initial credentials login and check if 2FA is enabled.
     */
    public function login(AdminLoginRequest $request): RedirectResponse
    {
        $admin = Admin::where('email', $request->email)->first();

        if (! $admin || ! Hash::check($request->password, $admin->password)) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }

        // Determine if 2FA OTP verification is required based on saved admin->two_factor_enabled status (0 or 1)
        $twoFactorEnabled = (bool) $admin->two_factor_enabled;

        // If 2FA is disabled, log in immediately without OTP
        if (! $twoFactorEnabled) {
            session()->forget('admin_pending_id');
            session()->regenerate();

            Auth::guard('admin')->login($admin);
            session(['admin_last_activity' => now()]);

            return redirect()->route('admin.dashboard')->with('success', 'Logged in successfully! Welcome back.');
        }

        // 2FA is enabled: Generate OTP and send email
        $otp = $admin->generateOtp(10);

        try {
            Mail::to($admin->email)->send(new AdminOtpMail($otp, 'Admin Panel Login'));
        } catch (\Throwable $e) {
            Log::error('Failed to send Admin OTP mail: ' . $e->getMessage());
        }

        // Store pending admin ID in session
        session(['admin_pending_id' => $admin->id]);

        return redirect()->route('admin.otp.show')->with('success', 'A 6-digit verification OTP has been sent to your email.');
    }

    /**
     * Show OTP verification view.
     */
    public function showOtp(): Response|RedirectResponse
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }

        $adminId = session('admin_pending_id');
        if (! $adminId) {
            return redirect()->route('admin.login')->with('error', 'Please enter your credentials first.');
        }

        $admin = Admin::find($adminId);
        if (! $admin) {
            session()->forget('admin_pending_id');
            return redirect()->route('admin.login');
        }

        // Mask email for display: e.g. a***n@attendance.com
        $parts = explode('@', $admin->email);
        $maskedEmail = substr($parts[0], 0, 1) . '***' . substr($parts[0], -1) . '@' . ($parts[1] ?? '');

        return Inertia::render('admin/auth/otp', [
            'masked_email' => $maskedEmail,
        ]);
    }

    /**
     * Verify OTP and complete login.
     */
    public function verifyOtp(VerifyOtpRequest $request): RedirectResponse
    {
        $adminId = session('admin_pending_id');
        if (! $adminId) {
            return redirect()->route('admin.login')->with('error', 'Session expired. Please log in again.');
        }

        $admin = Admin::find($adminId);
        if (! $admin) {
            return redirect()->route('admin.login');
        }

        if (! $admin->verifyOtp($request->otp)) {
            return back()->withErrors([
                'otp' => 'The OTP entered is invalid or has expired.',
            ]);
        }

        // Complete Admin authentication
        session()->forget('admin_pending_id');
        session()->regenerate();

        Auth::guard('admin')->login($admin);
        session(['admin_last_activity' => now()]);

        return redirect()->route('admin.dashboard')->with('success', 'Logged in successfully! Welcome back.');
    }

    /**
     * Resend OTP.
     */
    public function resendOtp(Request $request): RedirectResponse
    {
        $adminId = session('admin_pending_id');
        if (! $adminId) {
            return redirect()->route('admin.login');
        }

        $admin = Admin::find($adminId);
        if (! $admin) {
            return redirect()->route('admin.login');
        }

        $otp = $admin->generateOtp(10);

        try {
            Mail::to($admin->email)->send(new AdminOtpMail($otp, 'Resent: Admin Panel Login'));
        } catch (\Throwable $e) {
            Log::error('Failed to resend Admin OTP: ' . $e->getMessage());
        }

        return back()->with('success', 'A new verification code has been dispatched to your email.');
    }

    /**
     * Log the admin out.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('admin')->logout();
        session()->forget('admin_last_activity');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')->with('info', 'You have been logged out safely.');
    }
}
