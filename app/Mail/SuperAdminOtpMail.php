<?php

namespace App\Mail;

use App\Models\WebsiteSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SuperAdminOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $purpose;
    public string $brandname;

    /**
     * Create a new message instance.
     */
    public function __construct(string $otp, string $purpose = 'Super Admin Credential Change')
    {
        $this->otp = $otp;
        $this->purpose = $purpose;
        $settings = WebsiteSetting::current();
        $this->brandname = $settings->brandname ?? config('app.name');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->brandname}] Super Admin OTP: {$this->otp} ({$this->purpose})",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.super-admin-otp',
        );
    }
}

