<?php

namespace App\Mail;

use App\Models\ContactInquiry;
use App\Models\WebsiteSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public ContactInquiry $inquiry;
    public string $replyMessage;
    public string $brandname;

    /**
     * Create a new message instance.
     */
    public function __construct(ContactInquiry $inquiry, string $replyMessage)
    {
        $this->inquiry = $inquiry;
        $this->replyMessage = $replyMessage;
        $settings = WebsiteSetting::current();
        $this->brandname = $settings->brandname ?? config('app.name');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Re: {$this->inquiry->subject} - [{$this->brandname}]",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-reply',
        );
    }
}

