<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Mail\SuperAdminOtpMail;
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

        return Inertia::render('super-admin/profile/index', [
            'superAdmin' => [
                'id' => $superAdmin->id,
                'name' => $superAdmin->name,
                'email' => $superAdmin->email,
                'session_time' => $superAdmin->session_time,
                'created_at' => $superAdmin->created_at?->toFormattedDateString(),
            ],
        ]);
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

