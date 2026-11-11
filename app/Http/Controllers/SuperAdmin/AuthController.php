<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\WebsiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Show super admin login view.
     */
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::guard('super_admin')->check()) {
            return redirect()->route('super-admin.dashboard');
        }

        $settings = WebsiteSetting::current();

        return Inertia::render('super-admin/auth/login', [
            'brandname' => $settings->brandname ?? 'AttendEase Pro',
            'logo' => $settings->logo,
        ]);
    }

    /**
     * Authenticate super admin credentials.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::guard('super_admin')->attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            session(['super_admin_last_activity' => now()]);

            return redirect()->route('super-admin.dashboard')->with('success', 'Welcome to the Super Admin Portal!');
        }

        return back()->withErrors([
            'email' => 'The provided super admin credentials do not match our records.',
        ]);
    }

    /**
     * Super Admin Logout.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('super_admin')->logout();
        session()->forget('super_admin_last_activity');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('super-admin.login')->with('info', 'Logged out of Super Admin Portal.');
    }
}

