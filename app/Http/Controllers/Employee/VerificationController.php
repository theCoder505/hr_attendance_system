<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\WebsiteSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    /**
     * Handle the single-use verification token link.
     */
    public function verify(string $token): Response
    {
        $employee = Employee::where('verification_token', $token)->first();

        $settings = WebsiteSetting::current();

        if (! $employee) {
            return Inertia::render('employee/verify-result', [
                'status' => 'invalid',
                'message' => 'This verification link is invalid or has already been used. Please ask your administrator for a new link.',
                'brandname' => $settings->brandname ?? 'AttendEase',
            ]);
        }

        if ($employee->verification_expires_at && Carbon::now()->isAfter($employee->verification_expires_at)) {
            return Inertia::render('employee/verify-result', [
                'status' => 'expired',
                'message' => 'This verification link has expired. Please request a new verification link from your administrator.',
                'brandname' => $settings->brandname ?? 'AttendEase',
            ]);
        }

        // Generate high-entropy raw device token
        $rawDeviceToken = Str::random(64);
        $deviceTokenHash = hash('sha256', $rawDeviceToken);

        // Bind device to employee, set status to 1 (active), expire in 1 month, clear verification token
        $employee->update([
            'status' => 1,
            'device_token_hash' => $deviceTokenHash,
            'device_token_expires_at' => Carbon::now()->addMonth(),
            'verification_token' => null,
            'verification_expires_at' => null,
        ]);

        return Inertia::render('employee/verify-result', [
            'status' => 'success',
            'raw_token' => $rawDeviceToken,
            'employee' => [
                'name' => $employee->name,
                'uid' => $employee->uid,
                'role' => $employee->role,
            ],
            'expires_at' => Carbon::now()->addMonth()->toFormattedDateString(),
            'brandname' => $settings->brandname ?? 'AttendEase',
        ]);
    }
}
