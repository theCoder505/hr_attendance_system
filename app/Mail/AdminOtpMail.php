<?php

namespace App\Mail;

use App\Models\WebsiteSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $purpose;
    public string $brandname;

    /**
     * Create a new message instance.
     */
    public function __construct(string $otp, string $purpose = 'Admin Authentication')
    {
        $this->otp = $otp;
        $this->purpose = $purpose;
        $settings = WebsiteSetting::current();
        $this->brandname = $settings->brandname ?? 'Attendance Management';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->brandname}] Your Verification OTP: {$this->otp}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admin-otp',
        );
    }
}
