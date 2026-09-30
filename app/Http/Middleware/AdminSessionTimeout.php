<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminSessionTimeout
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('admin')->check()) {
            $admin = Auth::guard('admin')->user();
            $timeoutMinutes = $admin->session_time ?: 30;

            $lastActivity = session('admin_last_activity');

            if ($lastActivity && now()->diffInMinutes($lastActivity) >= $timeoutMinutes) {
                Auth::guard('admin')->logout();
                session()->forget('admin_last_activity');
                session()->invalidate();
                session()->regenerateToken();

                return redirect()->route('admin.login')->with('warning', 'Your session has expired due to inactivity. Please log in again.');
            }

            session(['admin_last_activity' => now()]);
        }

        return $next($request);
    }
}
