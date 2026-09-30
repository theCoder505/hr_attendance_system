<?php

namespace App\Http\Middleware;

use App\Models\Employee;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyDeviceToken
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $rawToken = $request->header('X-Device-Token') 
            ?? $request->input('device_token') 
            ?? $request->cookie('device_token');

        if (! $rawToken) {
            return response()->json([
                'success' => false,
                'code' => 'DEVICE_NOT_VERIFIED',
                'message' => 'Device not verified, contact admin.',
            ], 403);
        }

        $hash = hash('sha256', $rawToken);

        $employee = Employee::where('device_token_hash', $hash)->first();

        if (! $employee || $employee->status !== 1) {
            return response()->json([
                'success' => false,
                'code' => 'DEVICE_NOT_VERIFIED',
                'message' => 'Device not verified or employee is inactive. Please contact admin.',
            ], 403);
        }

        if (empty($employee->device_token_expires_at) || now()->isAfter($employee->device_token_expires_at)) {
            return response()->json([
                'success' => false,
                'code' => 'DEVICE_TOKEN_EXPIRED',
                'message' => 'Your device session has expired. Please contact admin for re-verification.',
            ], 403);
        }

        // Attach employee to request attributes for downstream use
        $request->attributes->set('employee', $employee);

        return $next($request);
    }
}
