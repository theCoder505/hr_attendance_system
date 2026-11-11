<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'bkash_number',
        'bkash_type',
        'bkash_enabled',
        'nagad_number',
        'nagad_type',
        'nagad_enabled',
        'bank_name',
        'bank_account_name',
        'bank_account_number',
        'bank_branch',
        'bank_routing',
        'bank_enabled',
        'payment_due_day',
        'default_monthly_fee',
        'whatsapp_number',
        'contact_number',
        'facebook_url',
        'youtube_url',
        'user_manual_content',
        'user_manual_pdf_path',
    ];

    protected $casts = [
        'bkash_enabled' => 'boolean',
        'nagad_enabled' => 'boolean',
        'bank_enabled' => 'boolean',
        'payment_due_day' => 'integer',
        'default_monthly_fee' => 'decimal:2',
    ];

    /**
     * Get or create the singleton platform setting instance.
     */
    public static function instance(): self
    {
        $setting = static::first();
        if (! $setting) {
            $manualPath = base_path('USER_MANUAL.md');
            $defaultManual = file_exists($manualPath) ? file_get_contents($manualPath) : '# Platform User Manual';

            $setting = static::create([
                'bkash_number' => '01700000000',
                'bkash_type' => 'Personal',
                'nagad_number' => '01800000000',
                'nagad_type' => 'Personal',
                'bank_name' => 'City Bank PLC',
                'bank_account_name' => 'AttendEase Tech',
                'bank_account_number' => '1102233445501',
                'bank_branch' => 'Gulshan Branch, Dhaka',
                'bank_routing' => '225272635',
                'payment_due_day' => 7,
                'default_monthly_fee' => 500.00,
                'user_manual_content' => $defaultManual,
            ]);
        }

        return $setting;
    }
}

