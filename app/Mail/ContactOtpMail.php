<?php

namespace App\Mail;

use App\Models\WebsiteSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $brandname;

    /**
     * Create a new message instance.
     */
    public function __construct(string $otp)
    {
        $this->otp = $otp;
        $settings = WebsiteSetting::current();
        $this->brandname = $settings->brandname ?? config('app.name');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $fromAddress = config('mail.from.address') ?: 'hello@example.com';
        $fromName = $this->brandname ?: config('mail.from.name', 'Attendance System');

        return new Envelope(
            from: new Address($fromAddress, $fromName),
            subject: "[{$this->brandname}] Email Verification Code: {$this->otp}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-otp',
        );
    }
}

