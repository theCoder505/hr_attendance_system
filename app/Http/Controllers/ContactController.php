<?php

namespace App\Http\Controllers;

use App\Mail\ContactOtpMail;
use App\Models\ContactInquiry;
use App\Models\PlatformSetting;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Display the surface website contact page.
     */
    public function index(Request $request): Response
    {
        $settings = WebsiteSetting::current();
        $platform = PlatformSetting::instance();

        $verifiedEmail = session('contact_email_verified') ? session('contact_verified_email') : null;

        return Inertia::render('contact/index', [
            'brandname' => $settings->brandname ?? config('app.name'),
            'logo' => $settings->logo,
            'verifiedEmail' => $verifiedEmail,
            'contactSettings' => [
                'whatsapp_number' => $platform->whatsapp_number,
                'contact_number' => $platform->contact_number,
                'facebook_url' => $platform->facebook_url,
                'youtube_url' => $platform->youtube_url,
            ],
        ]);
    }

    /**
     * Send email OTP to prospective store owner.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = trim(strtolower($request->email));
        $otp = (string) random_int(100000, 999999);

        session([
            'contact_otp' => $otp,
            'contact_otp_email' => $email,
            'contact_otp_expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::to($email)->send(new ContactOtpMail($otp));
        } catch (\Throwable $e) {
            Log::error('Failed to send contact OTP mail: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "A 6-digit OTP has been sent to {$email}. Please verify within 10 minutes.",
        ]);
    }

    /**
     * Verify the email OTP submitted by visitor.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $email = trim(strtolower($request->email));
        $savedOtp = session('contact_otp');
        $savedEmail = session('contact_otp_email');
        $expiresAt = session('contact_otp_expires_at');

        if (! $savedOtp || ! $savedEmail || ! $expiresAt || now()->isAfter($expiresAt)) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired or was not requested. Please request a new code.',
            ], 422);
        }

        if ($savedEmail !== $email || ! hash_equals((string) $savedOtp, trim($request->otp))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP code. Please check and try again.',
            ], 422);
        }

        // Mark email as verified in session
        session([
            'contact_email_verified' => true,
            'contact_verified_email' => $email,
        ]);
        session()->forget(['contact_otp', 'contact_otp_expires_at']);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully! You can now proceed to submit the contact inquiry.',
        ]);
    }

    /**
     * Submit contact inquiry (only if email was verified).
     */
    public function submit(Request $request): JsonResponse
    {
        $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'total_outlets' => ['required', 'integer', 'min:1', 'max:1000'],
            'avg_employees_per_outlet' => ['required', 'integer', 'min:1', 'max:10000'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $email = trim(strtolower($request->email));
        $isVerified = session('contact_email_verified') && session('contact_verified_email') === $email;

        if (! $isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'Please verify your email address using OTP before submitting the contact form.',
            ], 422);
        }

        ContactInquiry::create([
            'company_name' => trim($request->company_name),
            'subject' => trim($request->subject),
            'email' => $email,
            'phone' => trim($request->phone),
            'total_outlets' => (int) $request->total_outlets,
            'avg_employees_per_outlet' => (int) $request->avg_employees_per_outlet,
            'message' => trim($request->message),
            'status' => 'pending',
        ]);

        // Clear verification session
        session()->forget(['contact_email_verified', 'contact_verified_email']);

        return response()->json([
            'success' => true,
            'message' => 'Your inquiry has been received! Platform Super Admin will review your store details and get in touch with you.',
        ]);
    }
}

